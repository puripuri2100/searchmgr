import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { save, open } from "@tauri-apps/api/dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/api/fs";
import { data } from "./data";
import "./App.css";



function App() {

  const [data, setData] = useState<data[] | null>(null);
  const [dataPath, setDataPath] = useState<string | null>(null);

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

  async function new_button_click() {
    const d = {title: "タイトル", book_name: null, url: null, time_stamp: null, memo: "", keywords: []};
    if (data) {
      setData([d,...data])
    } else {
      setData([d])
    }
  }

  function NewButton() {
    return (
      <>
        <button className="newbutton" onClick={new_button_click}>+ New</button>
      </>
    )
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
          <NewButton/>
          {data.map((d: data, index) =>
            <div className="data">
              <input value={d.title} onChange={(e) => {changeTitle(index, e.target.value)}}/>
              <input value={d.url ? d.url : ""} onChange={(e) => {changeUrl(index, e.target.value)}}/>
              <input value={d.book_name ? d.book_name : ""} onChange={(e) => {changeBookName(index, e.target.value)}}/>
              <textarea value={d.memo} onChange={(e) => {changeMemo(index, e.target.value)}}/>
            </div>
          )}
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
