import { ReactElement, useEffect, useState } from "react";
import Modal from "react-modal";
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

  const default_data: data = {title: "", book_name: "", url: "", time_stamp: "", memo: "", keywords: []};
  const [data, setData] = useState<data[] | null>(null);
  const [dataPath, setDataPath] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [newData, setNewData] = useState<data>(default_data);
  const [editModal, setEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState(0);

  function open_create_modal() {
    setCreateModal(true);
  }
  function close_create_modal() {
    setNewData(default_data);
    setCreateModal(false);
  }

  function open_edit_modal(index: number) {
    if (data) {
      setNewData(data[index]);
      setEditIndex(index);
      setEditModal(true);
    }
  }
  function close_edit_modal() {
    setNewData(default_data);
    setEditModal(false);
  }

  async function new_create_button() {
    const path = await save({filters: [{name: "searchmgr file", extensions: ["smgr"]}]});
    if (path) {
      setDataPath(path);
      setData([]);
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
    }
  }

  function NewButton() {
    return (
      <>
        <button className="newbutton" onClick={open_create_modal}>+ New</button>
      </>
    )
  }

  async function deleteData(index: number) {
    if (data) {
      setData(data.filter((_, i) => i != index));
      setNewData(default_data);
      setEditModal(false);
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
          <Modal isOpen={createModal}>
            <InputArea title="タイトル"><input value={newData.title} onChange={(e) => {setNewData({...newData, title: e.target.value})}}/></InputArea>
            <InputArea title="リンク"><input value={newData.url} onChange={(e) => {setNewData({...newData, url: e.target.value})}}/></InputArea>
            <InputArea title="本"><input value={newData.book_name} onChange={(e) => {setNewData({...newData, book_name: e.target.value})}}/></InputArea>
            <InputArea title="メモ">
              <>
                <div className="textarea_dummy"></div>
                <textarea value={newData.memo} onChange={(e) => {setNewData({...newData, memo: e.target.value})}}/>
              </>
            </InputArea>
            <button onClick={close_create_modal}>キャンセル</button>
            <button className={newData.title.length == 0 ? "no_button" : "ok_button"} disabled={newData.title.length == 0} onClick={() => {
              if (data) {
                setData([newData,...data]);
              } else {
                setData([newData]);
              }
              close_create_modal();
            }}>
              作成
            </button>
          </Modal>

          <Modal isOpen={editModal}>
            <button className="delete_button" type="submit" onClick={() => deleteData(editIndex)}>削除</button>
            <InputArea title="タイトル"><input value={newData.title} onChange={(e) => {setNewData({...newData, title: e.target.value})}}/></InputArea>
            <InputArea title="リンク"><input value={newData.url} onChange={(e) => {setNewData({...newData, url: e.target.value})}}/></InputArea>
            <InputArea title="本"><input value={newData.book_name} onChange={(e) => {setNewData({...newData, book_name: e.target.value})}}/></InputArea>
            <InputArea title="メモ">
              <>
                <div className="textarea_dummy"></div>
                <textarea value={newData.memo} onChange={(e) => {setNewData({...newData, memo: e.target.value})}}/>
              </>
            </InputArea>
            <button onClick={close_edit_modal}>キャンセル</button>
            <button className={newData.title.length == 0 ? "no_button" : "ok_button"} disabled={newData.title.length == 0} onClick={() => {
              setData(data.map((d, i) => i == editIndex ? newData : d));
              close_edit_modal();
            }}>
              更新
            </button>
          </Modal>

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
                    <>
                      <div className="row_left">
                        <p className="data_title">{d.title}</p>
                        <button className="editbutton" onClick={() => open_edit_modal(index)}>編集</button>
                      </div>
                      {d.url ? <p>🔗 <a href={d.url} target="_blank">{d.url}</a></p> : <></>}
                      {d.book_name ? <p>📕 {d.book_name}</p> : <></>}
                      {d.memo.length == 0 ? <></> :
                        <div className="memo">
                          {d.memo.split('\n').map((s) => <p>{s}</p>)}
                        </div>
                      }
                    </>
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
