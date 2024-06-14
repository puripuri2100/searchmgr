// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use pulldown_cmark::{Event, Options, Parser, TextMergeStream};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
enum MarkdonwValue {
    Text(String),
    Rule,
    InlineCode(String),
    CheckBox(bool),
    InlineMath(String),
    BlockMath(String),
}

#[tauri::command]
fn parse_markdown(markdown_text: &str) -> Vec<Vec<MarkdonwValue>> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_YAML_STYLE_METADATA_BLOCKS);
    options.insert(Options::ENABLE_PLUSES_DELIMITED_METADATA_BLOCKS);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_MATH);
    options.insert(Options::ENABLE_SMART_PUNCTUATION);
    let parser = Parser::new_ext(markdown_text, options);
    let iterator = TextMergeStream::new(parser);
    let mut v = Vec::new();
    let mut tmp_lst = Vec::new();
    for event in iterator {
        match event {
            Event::Text(text) => {
                tmp_lst.push(MarkdonwValue::Text(format!("{text}")));
            }
            Event::InlineHtml(text) => {
                tmp_lst.push(MarkdonwValue::Text(format!("{text}")));
            }
            Event::Html(text) => {
                v.push(tmp_lst.clone());
                let l = text
                    .split('\n')
                    .map(|s| MarkdonwValue::Text(s.to_string()))
                    .collect();
                v.push(l);
                tmp_lst = Vec::new();
            }
            Event::Rule => {
                v.push(tmp_lst.clone());
                v.push(vec![MarkdonwValue::Rule]);
                tmp_lst = Vec::new();
            }
            Event::HardBreak => {
                v.push(tmp_lst.clone());
                tmp_lst = Vec::new();
            }
            Event::Code(code) => {
                tmp_lst.push(MarkdonwValue::InlineCode(format!("{code}")));
            }
            Event::TaskListMarker(bool) => {
                v.push(tmp_lst.clone());
                v.push(vec![MarkdonwValue::CheckBox(bool)]);
                tmp_lst = Vec::new();
            }
            Event::DisplayMath(math) => {
                v.push(tmp_lst.clone());
                v.push(vec![MarkdonwValue::BlockMath(format!("{math}"))]);
                tmp_lst = Vec::new();
            }
            Event::InlineMath(math) => {
                tmp_lst.push(MarkdonwValue::InlineMath(format!("{math}")));
            }
            _ => (),
        }
    }
    v
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![parse_markdown])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
