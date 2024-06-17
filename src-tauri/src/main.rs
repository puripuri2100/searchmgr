// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use pulldown_cmark::{Event, Options, Parser, Tag, TagEnd, TextMergeStream, DefaultBrokenLinkCallback};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
enum MarkdonwInline {
    Text(InlineType, String),
    InlineCode(String),
    InlineMath(String),
}

#[derive(Debug, Clone, Copy, Serialize)]
enum InlineType {
    Plain,
    Emphasis,
    Strong,
    Strike,
    EmphasisStrong,
    EmphasisStrike,
    StrongStrike,
    EmphasisStrongStrike,
}

impl InlineType {
    fn add_emphasis(&self) -> Self {
        match self {
            Self::Plain => Self::Emphasis,
            Self::Emphasis => Self::Emphasis,
            Self::Strong => Self::EmphasisStrong,
            Self::Strike => Self::EmphasisStrike,
            Self::EmphasisStrong => Self::EmphasisStrong,
            Self::EmphasisStrike => Self::EmphasisStrike,
            Self::StrongStrike => Self::EmphasisStrongStrike,
            Self::EmphasisStrongStrike => Self::EmphasisStrongStrike,
        }
    }
    fn add_strong(&self) -> Self {
        match self {
            Self::Plain => Self::Strong,
            Self::Emphasis => Self::EmphasisStrong,
            Self::Strong => Self::Strong,
            Self::Strike => Self::StrongStrike,
            Self::EmphasisStrong => Self::EmphasisStrong,
            Self::EmphasisStrike => Self::EmphasisStrongStrike,
            Self::StrongStrike => Self::StrongStrike,
            Self::EmphasisStrongStrike => Self::EmphasisStrongStrike,
        }
    }
    fn add_strike(&self) -> Self {
        match self {
            Self::Plain => Self::Strike,
            Self::Emphasis => Self::EmphasisStrike,
            Self::Strong => Self::StrongStrike,
            Self::Strike => Self::Strike,
            Self::EmphasisStrong => Self::EmphasisStrongStrike,
            Self::EmphasisStrike => Self::EmphasisStrike,
            Self::StrongStrike => Self::StrongStrike,
            Self::EmphasisStrongStrike => Self::EmphasisStrongStrike,
        }
    }
    fn remove_emphasis(&self) -> Self {
        match self {
            Self::Plain => Self::Plain,
            Self::Emphasis => Self::Plain,
            Self::Strong => Self::Strong,
            Self::Strike => Self::Strike,
            Self::EmphasisStrong => Self::Strong,
            Self::EmphasisStrike => Self::Strike,
            Self::StrongStrike => Self::StrongStrike,
            Self::EmphasisStrongStrike => Self::StrongStrike,
        }
    }
    fn remove_strong(&self) -> Self {
        match self {
            Self::Plain => Self::Plain,
            Self::Emphasis => Self::Emphasis,
            Self::Strong => Self::Plain,
            Self::Strike => Self::Strike,
            Self::EmphasisStrong => Self::Emphasis,
            Self::EmphasisStrike => Self::EmphasisStrike,
            Self::StrongStrike => Self::Strike,
            Self::EmphasisStrongStrike => Self::EmphasisStrike,
        }
    }
    fn remove_strike(&self) -> Self {
        match self {
            Self::Plain => Self::Plain,
            Self::Emphasis => Self::Emphasis,
            Self::Strong => Self::Strong,
            Self::Strike => Self::Plain,
            Self::EmphasisStrong => Self::EmphasisStrong,
            Self::EmphasisStrike => Self::Emphasis,
            Self::StrongStrike => Self::Strong,
            Self::EmphasisStrongStrike => Self::EmphasisStrong,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
enum MarkdonwBlock {
    Paragraph(Vec<MarkdonwInline>),
    Rule,
    BlockMath(String),
    Heading(usize),
    BlockCode(Option<String>, Vec<String>),
    Quote(Vec<MarkdonwBlock>),
}

#[derive(Debug, Clone, Copy)]
enum BlockType {
    Paragraph,
    BlockCode,
    Quote,
}

#[tauri::command]
fn parse_markdown(markdown_text: &str) -> Vec<MarkdonwBlock> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_MATH);
    options.insert(Options::ENABLE_SMART_PUNCTUATION);
    let parser = Parser::new_ext(markdown_text, options);
    let mut iterator = TextMergeStream::new(parser);
    let mut v = Vec::new();
    let mut inline_lst = Vec::new();
    let mut code_lst = Vec::new();
    let mut code_lang = None;
    let mut quote_lst = Vec::new();
    let mut block_type = BlockType::Paragraph;
    let mut inline_type = InlineType::Plain;
    while let Some(event) = iterator.next() {
        match event {
            Event::Start(Tag::Paragraph) => {
                match block_type {
                    BlockType::Paragraph => v.push(MarkdonwBlock::Paragraph(inline_lst.clone())),
                    BlockType::Quote => {
                        quote_lst.push(MarkdonwBlock::Paragraph(inline_lst.clone()))
                    }
                    BlockType::BlockCode => (),
                }
                inline_lst = Vec::new();
            }
            Event::Start(Tag::Heading { level, .. }) => {
                v.push(MarkdonwBlock::Paragraph(inline_lst.clone()));
                v.push(MarkdonwBlock::Heading(level as usize));
                inline_lst = Vec::new();
            }
            Event::Start(Tag::CodeBlock(kind)) => {
                let lang = if let pulldown_cmark::CodeBlockKind::Fenced(l) = kind {
                    Some(format!("{l}"))
                } else {
                    None
                };
                code_lang = lang;
                block_type = BlockType::BlockCode;
            }
            Event::End(TagEnd::CodeBlock) => {
                v.push(MarkdonwBlock::BlockCode(code_lang, code_lst.clone()));
                code_lst = Vec::new();
                block_type = BlockType::Paragraph;
                code_lang = None;
            }
            Event::Start(Tag::BlockQuote(_)) => {
                block_type = BlockType::Quote;
                quote_lst = Vec::new();
            }
            Event::End(TagEnd::BlockQuote) => {
                v.push(MarkdonwBlock::Quote(quote_lst));
                quote_lst = Vec::new();
                block_type = BlockType::Paragraph;
            }
            Event::Start(Tag::Emphasis) => {
                inline_type = inline_type.add_emphasis();
            }
            Event::End(TagEnd::Emphasis) => {
                inline_type = inline_type.remove_emphasis();
            }
            Event::Start(Tag::Strong) => {
                inline_type = inline_type.add_strong();
            }
            Event::End(TagEnd::Strong) => {
                inline_type = inline_type.remove_strong();
            }
            Event::Start(Tag::Strikethrough) => {
                inline_type = inline_type.add_strike();
            }
            Event::End(TagEnd::Strikethrough) => {
                inline_type = inline_type.remove_strike();
            }
            Event::Text(text) => match block_type {
                BlockType::Paragraph | BlockType::Quote => {
                    inline_lst.push(MarkdonwInline::Text(inline_type, format!("{text}")))
                }
                BlockType::BlockCode => code_lst.push(format!("{text}")),
            },
            Event::InlineHtml(text) => {
                inline_lst.push(MarkdonwInline::Text(inline_type, format!("{text}")));
            }
            Event::Html(text) => {
                inline_lst.push(MarkdonwInline::Text(inline_type, format!("{text}")));
            }
            Event::Rule => {
                match block_type {
                    BlockType::Paragraph => {
                        v.push(MarkdonwBlock::Paragraph(inline_lst.clone()));
                        v.push(MarkdonwBlock::Rule);
                    }
                    BlockType::Quote => {
                        quote_lst.push(MarkdonwBlock::Paragraph(inline_lst.clone()));
                        quote_lst.push(MarkdonwBlock::Rule);
                    }
                    BlockType::BlockCode => (),
                }
                inline_lst = Vec::new();
            }
            Event::HardBreak => {
                match block_type {
                    BlockType::Paragraph => {
                        v.push(MarkdonwBlock::Paragraph(inline_lst.clone()));
                    }
                    BlockType::Quote => {
                        quote_lst.push(MarkdonwBlock::Paragraph(inline_lst.clone()));
                    }
                    BlockType::BlockCode => (),
                }
                inline_lst = Vec::new();
            }
            Event::Code(code) => {
                inline_lst.push(MarkdonwInline::InlineCode(format!("{code}")));
            }
            Event::Start(Tag::Item) => {}
            Event::TaskListMarker(bool) => {
                v.push(MarkdonwBlock::Paragraph(inline_lst.clone()));
            }
            Event::DisplayMath(math) => {
                match block_type {
                    BlockType::Paragraph => {
                        v.push(MarkdonwBlock::Paragraph(inline_lst.clone()));
                        v.push(MarkdonwBlock::BlockMath(format!("{math}")));
                    }
                    BlockType::Quote => {
                        quote_lst.push(MarkdonwBlock::Paragraph(inline_lst.clone()));
                        quote_lst.push(MarkdonwBlock::BlockMath(format!("{math}")));
                    }
                    BlockType::BlockCode => (),
                }
                inline_lst = Vec::new();
            }
            Event::InlineMath(math) => {
                inline_lst.push(MarkdonwInline::InlineMath(format!("{math}")));
            }
            _ => (),
        }
    }
    v.push(MarkdonwBlock::Paragraph(inline_lst.clone()));
    v
}

fn parse_markdown_item(iter: &mut TextMergeStream<Parser<DefaultBrokenLinkCallback>>) {}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![parse_markdown])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
