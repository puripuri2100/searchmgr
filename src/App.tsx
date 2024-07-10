import { ReactElement, useEffect, useState } from "react";
import Modal from "react-modal";
import { invoke } from "@tauri-apps/api/tauri";
import { save, open } from "@tauri-apps/api/dialog";
import {
  readTextFile,
  readBinaryFile,
  writeBinaryFile,
} from "@tauri-apps/api/fs";
import { extname, basename } from "@tauri-apps/api/path";
import {
  data,
  markdown_block,
  markdown_inline,
  markdown_list,
  text_file,
  binary_file,
  data_with_id,
  text_file_type,
  binary_file_type,
  open_file_data,
  is_binary_file,
} from "./data";
import "./App.css";
import { CopyBlock, github } from "react-code-blocks";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import TextareaAutosize from "react-textarea-autosize";
import { CharacterMap, Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

type InputAreaProps = {
  children: ReactElement;
  title?: string;
};

function InputArea(props: InputAreaProps) {
  return (
    <div className="inputarea">
      {props.title ? <p>{props.title}</p> : <></>}
      {props.children}
    </div>
  );
}

function App() {
  const searchmgr_version = "0.0.1";
  function default_data(): data {
    const date = new Date();
    return {
      title: "",
      book_name: "",
      book_author: "",
      url: "",
      memo: "",
      binary_files: [],
      text_files: [],
      keywords: [],
      created_at: date.toISOString(),
      last_edit: date.toISOString(),
    };
  }
  const [dataId, setDataId] = useState<string>("");
  const [data, setData] = useState<data[] | null>(null);
  const [dataPath, setDataPath] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [newData, setNewData] = useState<data>(default_data());
  const [editModal, setEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState(0);
  const [nowLoadingFiles, setNowLoadingFiles] = useState<string[]>([]);
  const [fileModal, setFileModal] = useState(false);
  const [openFileData, setOpenFileData] = useState<open_file_data | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);

  type delete_dialog_value = "ok" | "cancel";
  type DeleteDialogProps = {
    onClose: (value: delete_dialog_value) => void;
  };

  function DeleteDialog(props: DeleteDialogProps) {
    return (
      <Modal
        isOpen={deleteModal}
        onRequestClose={() => {
          props.onClose("cancel");
          setDeleteModal(false);
        }}
        shouldCloseOnOverlayClick={true}
      >
        <div className="modal_title">本当に削除しますか？</div>
        <div className="modal_buttons">
          <button
            className="ok_button"
            onClick={() => {
              setDeleteModal(false);
              props.onClose("cancel");
            }}
          >
            削除しない
          </button>
          <button className="delete_button" onClick={() => props.onClose("ok")}>
            削除する
          </button>
        </div>
      </Modal>
    );
  }

  const [DeleteDialogConfig, setDeleteDialogConfig] =
    useState<DeleteDialogProps | null>(null);

  function open_create_modal() {
    setCreateModal(true);
  }
  function close_create_modal() {
    setNewData(default_data());
    setCreateModal(false);
    setNowLoadingFiles([]);
  }

  function open_edit_modal(index: number) {
    if (data) {
      setNewData(data[index]);
      setEditIndex(index);
      setEditModal(true);
    }
  }
  function close_edit_modal() {
    setNewData(default_data());
    setEditModal(false);
    setNowLoadingFiles([]);
  }

  async function new_create_button() {
    const path = await save({
      filters: [{ name: "searchmgr file", extensions: ["smgr"] }],
    });
    if (path) {
      setDataPath(path);
      setData([]);
      setDataId(crypto.randomUUID());
    }
  }

  async function import_button() {
    const path = await open({
      multiple: false,
      filters: [{ name: "searchmgr file", extensions: ["smgr"] }],
    });
    if (path && !Array.isArray(path)) {
      setDataPath(path);
      const file_binary: Uint8Array = await readBinaryFile(path);
      const file_binary_array = Array.from(file_binary);
      const data_with_id: data_with_id = await invoke("read_project_file", {
        binary: file_binary_array,
      });
      const data_lst: data[] = data_with_id.data;
      setData(data_lst);
      setDataId(data_with_id.id);
    }
  }

  function NewButton() {
    return (
      <>
        <button className="newbutton" onClick={open_create_modal}>
          + New
        </button>
      </>
    );
  }

  async function deleteData(index: number) {
    const delete_dialog_result = await new Promise<delete_dialog_value>(
      (resolve) => {
        setDeleteModal(true);
        setDeleteDialogConfig({
          onClose: resolve,
        });
      },
    );
    setDeleteDialogConfig(null);
    if (data && delete_dialog_result == "ok") {
      setData(data.filter((_, i) => i != index));
      setNewData(default_data());
      setEditModal(false);
    }
  }

  function Line(_props: {}) {
    return <hr></hr>;
  }

  function md_inline(md: markdown_inline) {
    if (md.type == "text") {
      return <>{md.string}</>;
    } else if (md.type == "br") {
      return <br />;
    } else if (md.type == "inline_code") {
      return <code>{md.string}</code>;
    } else if (md.type == "inline_math") {
      return <InlineMath>{md.string}</InlineMath>;
    } else if (md.type == "display_math") {
      return <BlockMath>{md.string}</BlockMath>;
    } else if (md.type == "emphasis") {
      return <em>{md.text?.map(md_inline)}</em>;
    } else if (md.type == "strong") {
      return <strong>{md.text?.map(md_inline)}</strong>;
    } else if (md.type == "strike") {
      return <s>{md.text?.map(md_inline)}</s>;
    } else if (md.type == "link" && md.link) {
      return <a href={md.link}>{md.text?.map(md_inline)}</a>;
    } else if (md.type == "image" && md.link && md.string) {
      return <img width="60%" alt={md.string} src={md.link} />;
    }
    return <></>;
  }

  function md_list(md: markdown_list): ReactElement {
    if (md.type == "item") {
      if (md.check == null) {
        return <li>{md.text?.map(md_inline)}</li>;
      } else {
        if (md.check) {
          return <li className="check_true">{md.text?.map(md_inline)}</li>;
        } else {
          return <li className="check_false">{md.text?.map(md_inline)}</li>;
        }
      }
    } else if (md.type == "ol" && md.start) {
      return <ol start={md.start}>{md.children?.map(md_list)}</ol>;
    } else if (md.type == "ul") {
      return <ul>{md.children?.map(md_list)}</ul>;
    }
    return <></>;
  }

  function md_block(md: markdown_block): ReactElement {
    if (md.type == "paragraph") {
      return <p>{md.text?.map(md_inline)}</p>;
    } else if (md.type == "rule") {
      return <Line />;
    } else if (md.type == "heading" && md.level && md.text) {
      // TODO
      return <strong>{md.text.map(md_inline)}</strong>;
    } else if (md.type == "block_code" && md.code) {
      return (
        <CopyBlock
          text={md.code}
          language={md.lang ? md.lang : "text"}
          theme={github}
          showLineNumbers={false}
        />
      );
    } else if (md.type == "quote") {
      return <blockquote>{md.quote_children?.map(md_block)}</blockquote>;
    } else if (md.type == "ol" && md.start) {
      return <ol start={md.start}>{md.children?.map(md_list)}</ol>;
    } else if (md.type == "ul") {
      return <ul>{md.children?.map(md_list)}</ul>;
    }
    return <></>;
  }

  function markdwon(blocks: markdown_block[]): ReactElement {
    return <>{blocks.map(md_block)}</>;
  }

  const [mdData, setMdData] = useState<markdown_block[][]>([]);

  useEffect(() => {
    (async () => {
      if (dataPath && data) {
        setMdData(Array(data.length).fill([]));
        const data_md_blocks = await Promise.all(
          data.map(async (d) => {
            const v = await invoke<markdown_block[]>("parse_markdown", {
              text: d.memo,
            });
            return v;
          }),
        );
        setMdData(data_md_blocks);

        const data_with_id: data_with_id = {
          id: dataId,
          searchmgr_version,
          data,
        };
        const output_contents: number[] = await invoke("write_project_file", {
          data: data_with_id,
        });
        const output_binary: Uint8Array = new Uint8Array(output_contents);
        await writeBinaryFile(dataPath, output_binary);
      }
    })();
  }, [data]);

  async function add_appended_images_button() {
    const file_path = await open({
      multiple: true,
      filters: [
        {
          name: "file",
          extensions: [
            "txt",
            "rs",
            "tex",
            "aux",
            "json",
            "yaml",
            "yml",
            "toml",
            "c",
            "cpp",
            "cxx",
            "ml",
            "mli",
            "saty",
            "satyh",
            "satyg",
            "jpg",
            "jpeg",
            "png",
            "pdf",
          ],
        },
      ],
    });
    if (file_path) {
      let file_path_lst = [];
      if (Array.isArray(file_path)) {
        file_path_lst = file_path;
      } else {
        file_path_lst = [file_path];
      }
      setNowLoadingFiles(file_path_lst);
      await Promise.all(
        file_path_lst.map(async (file_path) => {
          const file_ext_name = await extname(file_path);
          if (
            file_ext_name == "png" ||
            file_ext_name == "jpeg" ||
            file_ext_name == "jpg" ||
            file_ext_name == "pdf"
          ) {
            // binary file
            let file_type: binary_file_type = "pdf";
            if (file_ext_name == "png") {
              file_type = "png";
            } else if (file_ext_name == "jpeg" || file_ext_name == "jpg") {
              file_type = "jpeg";
            } else if (file_ext_name == "pdf") {
              file_type = "pdf";
            }
            const file_name = await basename(file_path);
            const contents_binary = await readBinaryFile(file_path);
            const contents = Array.from(contents_binary);
            const new_binary_file: binary_file = {
              file_type,
              file_name,
              contents,
            };
            setNewData({
              ...newData,
              binary_files: [new_binary_file, ...newData.binary_files],
            });
          } else {
            // text file
            let file_type: text_file_type = "any_text_file";
            if (file_ext_name == "txt") {
              file_type = "text";
            } else if (file_ext_name == "rs") {
              file_type = "rust";
            } else if (file_ext_name == "tex" || file_ext_name == "aux") {
              file_type = "tex";
            } else if (file_ext_name == "json") {
              file_type = "json";
            } else if (file_ext_name == "toml") {
              file_type = "toml";
            } else if (file_ext_name == "yaml" || file_ext_name == "yml") {
              file_type = "yaml";
            } else if (file_ext_name == "c") {
              file_type = "c";
            } else if (file_ext_name == "cpp" || file_ext_name == "cxx") {
              file_type = "cpp";
            } else if (file_ext_name == "ml" || file_ext_name == "mli") {
              file_type = "ocaml";
            } else if (
              file_ext_name == "saty" ||
              file_ext_name == "satyh" ||
              file_ext_name == "satyg"
            ) {
              file_type = "satysfi";
            }
            const file_name = await basename(file_path);
            const contents = await readTextFile(file_path);
            const new_text_file: text_file = {
              file_name,
              contents,
              file_type,
            };
            setNewData({
              ...newData,
              text_files: [new_text_file, ...newData.text_files],
            });
          }
          setNowLoadingFiles(nowLoadingFiles.filter((p) => file_path != p));
        }),
      );
      setNowLoadingFiles([]);
    }
  }

  function open_file_button(
    is_binary_file: boolean,
    data_index: number,
    file_index: number,
  ) {
    if (data) {
      const file_data = is_binary_file
        ? data[data_index].binary_files[file_index]
        : data[data_index].text_files[file_index];
      setOpenFileData({
        data_index,
        file_index,
        file_data,
      });
      setFileModal(true);
    }
  }

  function close_file_modal() {
    setFileModal(false);
    setOpenFileData(null);
  }

  async function delete_file_data(
    is_binary_file: boolean,
    data_index: number,
    file_index: number,
  ) {
    const delete_dialog_result = await new Promise<delete_dialog_value>(
      (resolve) => {
        setDeleteModal(true);
        setDeleteDialogConfig({
          onClose: resolve,
        });
      },
    );
    setDeleteDialogConfig(null);
    if (data && delete_dialog_result == "ok") {
      if (is_binary_file) {
        const new_binary_files = data[data_index].binary_files.filter(
          (_, i_i) => i_i != file_index,
        );
        setData(
          data.map((d, d_i) =>
            d_i == data_index ? { ...d, binary_files: new_binary_files } : d,
          ),
        );
      } else {
        const new_text_files = data[data_index].text_files.filter(
          (_, i_i) => i_i != file_index,
        );
        setData(
          data.map((d, d_i) =>
            d_i == data_index ? { ...d, text_files: new_text_files } : d,
          ),
        );
      }
    }
    setFileModal(false);
    setOpenFileData(null);
  }

  function gen_image_blob_url(arr: number[], image_type: string): string {
    const buf = new Uint8Array(arr);
    const blob = new Blob([buf], {
      type: `image/${image_type}`,
    });
    const url = window.URL.createObjectURL(blob);
    return url;
  }

  const characterMap: CharacterMap = {
    isCompressed: true,
    url: "https://unpkg.com/pdfjs-dist@2.6.347/cmaps/",
  };

  return (
    <>
      {data ? (
        <>
          {DeleteDialogConfig ? (
            <DeleteDialog {...DeleteDialogConfig}></DeleteDialog>
          ) : (
            <></>
          )}

          <Modal
            onRequestClose={close_create_modal}
            shouldCloseOnOverlayClick={true}
            isOpen={createModal}
          >
            <InputArea title="タイトル">
              <input
                value={newData.title}
                onChange={(e) => {
                  setNewData({ ...newData, title: e.target.value });
                }}
              />
            </InputArea>
            <InputArea title="リンク">
              <input
                value={newData.url}
                onChange={(e) => {
                  setNewData({ ...newData, url: e.target.value });
                }}
              />
            </InputArea>
            <InputArea title="本">
              <input
                value={newData.book_name}
                onChange={(e) => {
                  setNewData({ ...newData, book_name: e.target.value });
                }}
              />
            </InputArea>
            <InputArea title="メモ">
              <>
                <TextareaAutosize
                  minRows={2}
                  value={newData.memo}
                  onChange={(e) => {
                    setNewData({ ...newData, memo: e.target.value });
                  }}
                />
              </>
            </InputArea>
            <button
              className="add_appended_button"
              onClick={add_appended_images_button}
            >
              📁添付ファイル
            </button>
            {nowLoadingFiles.length == 0 ? <></> : <p>ファイル読み込み中……</p>}
            <div className="appended_images">
              {nowLoadingFiles.map((image_path) => {
                const file_name = image_path.split("/").pop();
                const file_name2 = file_name?.split("\\").pop();
                return (
                  <>
                    <p>{file_name2}</p>
                  </>
                );
              })}
            </div>
            {newData.binary_files.length + newData.text_files.length == 0 ? (
              <></>
            ) : (
              <p>添付ファイル</p>
            )}
            <ul>
              {newData.binary_files.map((binary_file) => (
                <li>{binary_file.file_name}</li>
              ))}
              {newData.text_files.map((text_file) => (
                <li>{text_file.file_name}</li>
              ))}
            </ul>
            <button onClick={close_create_modal}>キャンセル</button>
            <button
              className={
                newData.title.length == 0 || nowLoadingFiles.length != 0
                  ? "no_button"
                  : "ok_button"
              }
              disabled={
                newData.title.length == 0 || nowLoadingFiles.length != 0
              }
              onClick={() => {
                if (data) {
                  setData([newData, ...data]);
                } else {
                  setData([newData]);
                }
                close_create_modal();
              }}
            >
              作成
            </button>
          </Modal>

          <Modal
            onRequestClose={close_edit_modal}
            shouldCloseOnOverlayClick={true}
            isOpen={editModal}
          >
            <button
              className="delete_button"
              type="submit"
              onClick={() => deleteData(editIndex)}
            >
              削除
            </button>
            <InputArea title="タイトル">
              <input
                value={newData.title}
                onChange={(e) => {
                  setNewData({ ...newData, title: e.target.value });
                }}
              />
            </InputArea>
            <InputArea title="リンク">
              <input
                type="url"
                value={newData.url}
                onChange={(e) => {
                  setNewData({ ...newData, url: e.target.value });
                }}
              />
            </InputArea>
            <InputArea title="本">
              <input
                value={newData.book_name}
                onChange={(e) => {
                  setNewData({ ...newData, book_name: e.target.value });
                }}
              />
            </InputArea>
            <InputArea title="メモ">
              <>
                <TextareaAutosize
                  minRows={2}
                  value={newData.memo}
                  onChange={(e) => {
                    setNewData({ ...newData, memo: e.target.value });
                  }}
                />
              </>
            </InputArea>
            <button
              className="add_appended_button"
              onClick={add_appended_images_button}
            >
              📁添付ファイル
            </button>
            {nowLoadingFiles.length == 0 ? <></> : <p>ファイル読み込み中……</p>}
            <ul>
              {nowLoadingFiles.map((file_path) => {
                const file_name = file_path.split("/").pop();
                const file_name2 = file_name?.split("\\").pop();
                return (
                  <>
                    <li>{file_name2}</li>
                  </>
                );
              })}
            </ul>
            {newData.binary_files.length + newData.text_files.length == 0 ? (
              <></>
            ) : (
              <p>添付ファイル</p>
            )}
            <ul>
              {newData.binary_files.map((binary_file) => (
                <li>{binary_file.file_name}</li>
              ))}
              {newData.text_files.map((text_file) => (
                <li>{text_file.file_name}</li>
              ))}
            </ul>
            <button onClick={close_edit_modal}>キャンセル</button>
            <button
              className={
                newData.title.length == 0 || nowLoadingFiles.length != 0
                  ? "no_button"
                  : "ok_button"
              }
              disabled={
                newData.title.length == 0 || nowLoadingFiles.length != 0
              }
              onClick={() => {
                const date = new Date();
                const date_str = date.toISOString();
                setNewData({ ...newData, last_edit: date_str });
                setData(data.map((d, i) => (i == editIndex ? newData : d)));
                close_edit_modal();
              }}
            >
              更新
            </button>
          </Modal>

          <Modal
            onRequestClose={close_file_modal}
            shouldCloseOnOverlayClick={true}
            isOpen={fileModal}
          >
            {openFileData ? (
              <>
                <button
                  className="delete_button"
                  type="submit"
                  onClick={() => {
                    delete_file_data(
                      is_binary_file(openFileData.file_data.file_type),
                      openFileData.data_index,
                      openFileData.file_index,
                    );
                  }}
                >
                  削除
                </button>
                <p>{openFileData.file_data.file_name}</p>
                {openFileData.file_data.file_type == "jpeg" ||
                openFileData.file_data.file_type == "png" ? (
                  <>
                    <img
                      className="appended_img"
                      src={gen_image_blob_url(
                        openFileData.file_data.contents,
                        openFileData.file_data.file_type,
                      )}
                    />
                  </>
                ) : openFileData.file_data.file_type == "pdf" ? (
                  <div>
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                      <Viewer
                        fileUrl={
                          new Uint8Array(openFileData.file_data.contents)
                        }
                        characterMap={characterMap}
                      />
                    </Worker>
                  </div>
                ) : !Array.isArray(openFileData.file_data.contents) ? (
                  <CopyBlock
                    text={openFileData.file_data.contents}
                    language={
                      openFileData.file_data.file_type == "any_text_file"
                        ? "text"
                        : openFileData.file_data.file_type
                    }
                    theme={github}
                    showLineNumbers={false}
                  />
                ) : (
                  <></>
                )}
              </>
            ) : (
              <></>
            )}
            <div>
              <button onClick={close_file_modal}>閉じる</button>
            </div>
          </Modal>

          <div className="contents">
            <div className="side">
              {data.map((d: data, index: number) => (
                <div className="side_contents">
                  <a href={`#data${index}`}>{d.title}</a>
                </div>
              ))}
            </div>
            <div className="main">
              <NewButton />
              {data.map((d: data, index: number) => (
                <>
                  {index == 0 ? <></> : <Line />}
                  <div className="data" id={`data${index}`}>
                    <>
                      <div className="row_left">
                        <p className="data_title">{d.title}</p>
                        <button
                          className="editbutton"
                          onClick={() => open_edit_modal(index)}
                        >
                          編集
                        </button>
                      </div>
                      {d.url ? (
                        <p>
                          🔗{" "}
                          <a href={d.url} target="_blank" rel="noreferrer">
                            {d.url}
                          </a>
                        </p>
                      ) : (
                        <></>
                      )}
                      {d.book_name ? <p>📕 {d.book_name}</p> : <></>}
                      {mdData.length > index ? (
                        <>{markdwon(mdData[index])}</>
                      ) : (
                        <></>
                      )}
                      <div className="appended_images">
                        {d.binary_files.map((binary_file, file_index) => (
                          <button
                            className="appended_file"
                            onClick={() =>
                              open_file_button(true, index, file_index)
                            }
                          >
                            {binary_file.file_name}
                          </button>
                        ))}
                        {d.text_files.map((text_file, file_index) => (
                          <button
                            className="appended_file"
                            onClick={() =>
                              open_file_button(false, index, file_index)
                            }
                          >
                            {text_file.file_name}
                          </button>
                        ))}
                      </div>
                    </>
                  </div>
                </>
              ))}
            </div>
          </div>
        </>
      ) : dataPath ? (
        <>
          <div className="container">
            <p>Now Loading . . .</p>
          </div>
        </>
      ) : (
        <div className="container">
          <div className="rowbuttons">
            <button
              className="rowbutton"
              type="submit"
              onClick={new_create_button}
            >
              New Create
            </button>
            <button className="rowbutton" type="submit" onClick={import_button}>
              Import
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
