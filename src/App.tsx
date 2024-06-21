import { ReactElement, useEffect, useState } from "react";
import Modal from "react-modal";
import { invoke } from "@tauri-apps/api/tauri";
import { save, open } from "@tauri-apps/api/dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/api/fs";
import { data, markdown_block, markdown_inline, markdown_list } from "./data";
import "./App.css";
import { CopyBlock, github } from 'react-code-blocks';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

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

  function md_inline(md: markdown_inline) {
    if (md.type == 'text') {
      return (<>{md.string}</>)
    } else if (md.type == "br") {
      return (<br />)
    } else if (md.type == "inline_code") {
      return <code>{md.string}</code>
    } else if (md.type == "inline_math") {
      return (<InlineMath>{md.string}</InlineMath>)
    } else if (md.type == "display_math") {
      return (<BlockMath>{md.string}</BlockMath>)
    } else if (md.type == "emphasis") {
      return (<em>{md.text?.map(md_inline)}</em>)
    } else if (md.type == "strong") {
      return (<strong>{md.text?.map(md_inline)}</strong>)
    } else if (md.type == "strike") {
      return (<s>{md.text?.map(md_inline)}</s>)
    } else if (md.type == "link" && md.link) {
      return (<a href={md.link}>{md.text?.map(md_inline)}</a>)
    } else if (md.type == "image" && md.link && md.string) {
      return (<img width="60%" alt={md.string} src={md.link} />)
    }
    return <></>
  }

  function md_list(md: markdown_list): ReactElement {
    if (md.type == "item") {
      if (md.check == null) {
        return <li>{md.text?.map(md_inline)}</li>
      } else {
        if (md.check) {
          return <li className="check_true">{md.text?.map(md_inline)}</li>
        } else {
          return <li className="check_false">{md.text?.map(md_inline)}</li>
        }
      }
    } else if (md.type == "ol" && md.start) {
      return <ol start={md.start}>{md.children?.map(md_list)}</ol>
    } else if (md.type == "ul") {
      return <ul>{md.children?.map(md_list)}</ul>
    }
    return <></>
  }

  function md_block(md: markdown_block): ReactElement {
      if (md.type == 'paragraph') {
        return (<p>{md.text?.map(md_inline)}</p>)
      } else if (md.type == "rule") {
        return (<Line />)
      } else if (md.type == "heading" && md.level && md.text) {
        // TODO
        return (<strong>{md.text.map(md_inline)}</strong>)
      } else if (md.type == "block_code" && md.code) {
        return (
          <CopyBlock
            text={md.code}
            language={md.lang ? md.lang : "text"}
            theme={github}
            showLineNumbers={false}
          />
        )
      } else if (md.type == "quote") {
        return (<blockquote>{md.quote_children?.map(md_block)}</blockquote>)
      } else if (md.type == "ol" && md.start) {
        return <ol start={md.start}>{md.children?.map(md_list)}</ol>
      } else if (md.type == "ul") {
        return <ul>{md.children?.map(md_list)}</ul>
      }
      return <></>
  }

  function markdwon(blocks: markdown_block[]): ReactElement {
    return <>{blocks.map(md_block)}</>
  }

  const [mdData, setMdData] = useState<markdown_block[][]>([]);

  useEffect(() => {
    (async() => {
      if (dataPath && data) {
        setMdData(Array(data.length).fill([]));
        const data_md_blocks = await Promise.all(data.map(async (d) => {
          const v = await invoke<markdown_block[]>('parse_markdown', {text: d.memo});
          return v;
        }));
        setMdData(data_md_blocks);

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
                      {mdData.length > index ? <>{markdwon(mdData[index])}</> : <></>}
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
