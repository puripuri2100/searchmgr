import { ReactElement, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { save, open } from "@tauri-apps/api/dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/api/fs";
import { data } from "./data";
import "./App.css";

type InputAreaProps = {
  children: ReactElement;
  title?: string;
}

function InputArea(props: InputAreaProps) {
  return (
    <div className="inputarea">
      {props.title ? <p>{props.title}</p> : <></>}
      {props.children}
    </div>
  )
}

function App() {

  const [data, setData] = useState<data[] | null>(null);
  const [dataPath, setDataPath] = useState<string | null>(null);
  const [isEditList, setIsEditList] = useState<boolean[]>([]);

  async function new_create_button() {
    const path = await save({filters: [{name: "searchmgr file", extensions: ["smgr"]}]});
    if (path) {
      setDataPath(path);
      setData([]);
      setIsEditList([]);
    }
  }

  async function import_button() {
    const path = await open({
      multiple: false,
      filters: [{name: "searchmgr file", extensions: ["smgr"]}]
    });
    if (path && !Array.isArray(path)) {
      setDataPath(path);
      const text = await readTextFile(path);
      const data_lst: data[] = JSON.parse(text);
      setData(data_lst);
      setIsEditList(Array(data_lst.length).fill(false));
    }
  }

  async function new_button_click() {
    const d = {title: "タイトル", book_name: null, url: null, time_stamp: null, memo: "", keywords: []};
    if (data) {
      setData([d,...data]);
      setIsEditList([true,...isEditList]);
    } else {
      setData([d]);
      setIsEditList([true]);
    }
  }

  function NewButton() {
    return (
      <>
        <button className="newbutton" onClick={new_button_click}>+ New</button>
      </>
    )
  }

  async function changeIsEdit(index: number) {
    if (data) {
      setIsEditList(isEditList.map((b, i) => i == index ? !b : b))
    }
  }

  async function changeTitle(index: number, v: string) {
    if (data) {
      setData(data.map((d, i) => i == index ? {...d, title: v} : d))
    }
  }

  async function changeUrl(index: number, v: string) {
    if (data) {
      setData(data.map((d, i) => i == index ? {...d, url: v} : d))
    }
  }

  async function changeBookName(index: number, v: string) {
    if (data) {
      setData(data.map((d, i) => i == index ? {...d, book_name: v} : d))
    }
  }

  async function changeKeyWords(index: number, v: string[]) {
    if (data) {
      setData(data.map((d, i) => i == index ? {...d, keywords: v} : d))
    }
  }

  async function changeMemo(index: number, v: string) {
    if (data) {
      setData(data.map((d, i) => i == index ? {...d, memo: v} : d))
    }
  }

  async function deleteData(index: number) {
    if (data) {
      setData(data.filter((_, i) => i != index))
      setIsEditList(isEditList.filter((_, i) => i != index))
    }
  }

  function Line(_props: {}) {
    return <hr></hr>
  }

  useEffect(() => {
    (async() => {
      if (dataPath && data) {
        const text = JSON.stringify(data);
        await writeTextFile(dataPath, text);
      }
    })()
  }, [data])


  return (
    <>
      {data ?
        <>
          <div className="contents">
            <div className="side">
              {data.map((d: data, index:number) => <div><a href={`#data${index}`}>{d.title}</a></div>)}
            </div>
            <div className="main">
              <NewButton/>
              {data.map((d: data, index: number) =>
                <>
                {index == 0 ? <></> : <Line/>}
                  <div className="data" id={`data${index}`}>
                    {isEditList[index] ?
                      <>
                        <button className="editbutton" onClick={() => changeIsEdit(index)}>確定</button>
                        <InputArea><input value={d.title} onChange={(e) => {changeTitle(index, e.target.value)}}/></InputArea>
                        <InputArea title="URL"><input value={d.url ? d.url : ""} onChange={(e) => {changeUrl(index, e.target.value)}}/></InputArea>
                        <InputArea title="本"><input value={d.book_name ? d.book_name : ""} onChange={(e) => {changeBookName(index, e.target.value)}}/></InputArea>
                        <InputArea title="メモ">
                          <>
                            <div className="textarea_dummy"></div>
                            <textarea value={d.memo} onChange={(e) => {changeMemo(index, e.target.value)}}/>
                          </>
                        </InputArea>
                        <button type="submit" onClick={() => deleteData(index)}>削除</button>
                      </>
                      :
                      <>
                        <button className="editbutton" onClick={() => changeIsEdit(index)}>編集</button>
                        <p>{d.title}</p>
                        {d.url ? <a href={d.url} target="_blank">{d.url}</a> : <></>}
                        {d.book_name ? <p>{d.book_name}</p> : <></>}
                        {d.memo.split('\n').map((s) => <p>{s}</p>)}
                      </>
                    }
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      :
        <div className="container">
          <div className="rowbuttons">
            <button className="rowbutton" type="submit" onClick={new_create_button}>New Create</button>
            <button className="rowbutton" type="submit" onClick={import_button}>Import</button>
          </div>
        </div>
      }
    </>
  );
}

export default App;
