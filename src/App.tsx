import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
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
          {data.map((d: data, index) => <p>{index}: {d.title}</p>)}
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
