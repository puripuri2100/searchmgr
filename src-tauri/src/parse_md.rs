#![allow(clippy::while_let_on_iterator)]

use pulldown_cmark::{
    CodeBlockKind, DefaultBrokenLinkCallback, Event, Options, Parser, Tag, TagEnd,
};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MarkdonwInline {
    Text {
        string: String,
    },
    InlineCode {
        string: String,
    },
    InlineMath {
        string: String,
    },
    DisplayMath {
        string: String,
    },
    Emphasis {
        text: Vec<MarkdonwInline>,
    },
    Strong {
        text: Vec<MarkdonwInline>,
    },
    Strike {
        text: Vec<MarkdonwInline>,
    },
    Br,
    Link {
        link: String,
        text: Vec<MarkdonwInline>,
    },
    Image {
        link: String,
        string: String,
    },
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MarkdonwBlock {
    Paragraph {
        text: Vec<MarkdonwInline>,
    },
    Rule,
    Heading {
        level: usize,
        text: Vec<MarkdonwInline>,
    },
    BlockCode {
        lang: Option<String>,
        code: String,
    },
    Quote {
        quote_children: Vec<MarkdonwBlock>,
    },
    Ol {
        start: u64,
        children: Vec<MarkdonwList>,
    },
    Ul {
        children: Vec<MarkdonwList>,
    },
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MarkdonwList {
    Ol {
        start: u64,
        children: Vec<MarkdonwList>,
    },
    Ul {
        children: Vec<MarkdonwList>,
    },
    Item {
        check: Option<bool>,
        text: Vec<MarkdonwInline>,
    },
}

fn parse_inline(iter: &mut Parser<DefaultBrokenLinkCallback>, end: TagEnd) -> Vec<MarkdonwInline> {
    let mut v = Vec::new();
    while let Some(event) = iter.next() {
        match event {
            Event::End(tag_end) => {
                if tag_end == end {
                    break;
                }
            }
            Event::HardBreak => v.push(MarkdonwInline::Br),
            Event::Text(text) => v.push(MarkdonwInline::Text {
                string: format!("{text}"),
            }),
            Event::Code(text) => v.push(MarkdonwInline::InlineCode {
                string: format!("{text}"),
            }),
            Event::InlineMath(text) => v.push(MarkdonwInline::InlineMath {
                string: format!("{text}"),
            }),
            Event::DisplayMath(math) => v.push(MarkdonwInline::DisplayMath {
                string: format!("{math}"),
            }),
            Event::InlineHtml(text) => v.push(MarkdonwInline::Text {
                string: format!("{text}"),
            }),
            Event::Html(text) => v.push(MarkdonwInline::Text {
                string: format!("{text}"),
            }),
            Event::Start(Tag::Emphasis) => {
                let inline = parse_inline(iter, TagEnd::Emphasis);
                v.push(MarkdonwInline::Emphasis { text: inline });
            }
            Event::Start(Tag::Strong) => {
                let inline = parse_inline(iter, TagEnd::Strong);
                v.push(MarkdonwInline::Strong { text: inline });
            }
            Event::Start(Tag::Strikethrough) => {
                let inline = parse_inline(iter, TagEnd::Strikethrough);
                v.push(MarkdonwInline::Strike { text: inline });
            }
            Event::Start(Tag::Link { dest_url: link, .. }) => {
                let inline = parse_inline(iter, TagEnd::Link);
                v.push(MarkdonwInline::Link {
                    link: format!("{link}"),
                    text: inline,
                });
            }
            Event::Start(Tag::Image { dest_url: link, .. }) => {
                let mut string = String::new();
                while let Some(event) = iter.next() {
                    match event {
                        Event::End(TagEnd::Image) => break,
                        Event::Text(s) => string.push_str(&s),
                        _ => (),
                    }
                }
                v.push(MarkdonwInline::Image {
                    link: format!("{link}"),
                    string,
                });
            }
            _ => (),
        }
    }
    v
}

fn parse_list_item(
    iter: &mut Parser<DefaultBrokenLinkCallback>,
) -> (Option<bool>, Vec<MarkdonwInline>) {
    let mut v = Vec::new();
    let mut check = None;
    while let Some(event) = iter.next() {
        match event {
            Event::End(TagEnd::Item) => {
                break;
            }
            Event::TaskListMarker(b) => check = Some(b),

            Event::HardBreak => v.push(MarkdonwInline::Br),
            Event::Text(text) => v.push(MarkdonwInline::Text {
                string: format!("{text}"),
            }),
            Event::Code(text) => v.push(MarkdonwInline::InlineCode {
                string: format!("{text}"),
            }),
            Event::InlineMath(text) => v.push(MarkdonwInline::InlineMath {
                string: format!("{text}"),
            }),
            Event::DisplayMath(math) => v.push(MarkdonwInline::DisplayMath {
                string: format!("{math}"),
            }),
            Event::InlineHtml(text) => v.push(MarkdonwInline::Text {
                string: format!("{text}"),
            }),
            Event::Html(text) => v.push(MarkdonwInline::Text {
                string: format!("{text}"),
            }),
            Event::Start(Tag::Emphasis) => {
                let inline = parse_inline(iter, TagEnd::Emphasis);
                v.push(MarkdonwInline::Emphasis { text: inline });
            }
            Event::Start(Tag::Strong) => {
                let inline = parse_inline(iter, TagEnd::Strong);
                v.push(MarkdonwInline::Strong { text: inline });
            }
            Event::Start(Tag::Strikethrough) => {
                let inline = parse_inline(iter, TagEnd::Strikethrough);
                v.push(MarkdonwInline::Strike { text: inline });
            }
            Event::Start(Tag::Link { dest_url: link, .. }) => {
                let inline = parse_inline(iter, TagEnd::Link);
                v.push(MarkdonwInline::Link {
                    link: format!("{link}"),
                    text: inline,
                });
            }
            Event::Start(Tag::Image { dest_url: link, .. }) => {
                let mut string = String::new();
                while let Some(event) = iter.next() {
                    match event {
                        Event::End(TagEnd::Image) => break,
                        Event::Text(s) => string.push_str(&s),
                        _ => (),
                    }
                }
                v.push(MarkdonwInline::Image {
                    link: format!("{link}"),
                    string,
                });
            }
            _ => (),
        }
    }
    (check, v)
}

fn parser_list(iter: &mut Parser<DefaultBrokenLinkCallback>, is_ol: bool) -> Vec<MarkdonwList> {
    let mut v = Vec::new();
    while let Some(e) = iter.next() {
        match e {
            Event::End(TagEnd::List(is_ol2)) => {
                if is_ol == is_ol2 {
                    break;
                }
            }
            Event::Start(Tag::List(start_opt)) => {
                if let Some(start) = start_opt {
                    let children = parser_list(iter, true);
                    v.push(MarkdonwList::Ol { start, children });
                } else {
                    let children = parser_list(iter, false);
                    v.push(MarkdonwList::Ul { children });
                }
            }
            Event::Start(Tag::Item) => {
                let (check, text) = parse_list_item(iter);
                v.push(MarkdonwList::Item { check, text });
            }
            _ => (),
        }
    }
    v
}

fn parse_block(
    iter: &mut Parser<DefaultBrokenLinkCallback>,
    end: Option<TagEnd>,
) -> Vec<MarkdonwBlock> {
    let mut v = Vec::new();
    while let Some(event) = iter.next() {
        match event {
            Event::End(e) => {
                if Some(e) == end {
                    break;
                }
            }
            Event::Start(Tag::Paragraph) => {
                let para = parse_inline(iter, TagEnd::Paragraph);
                v.push(MarkdonwBlock::Paragraph { text: para });
            }
            Event::Start(Tag::HtmlBlock) => {
                let para = parse_inline(iter, TagEnd::HtmlBlock);
                v.push(MarkdonwBlock::Paragraph { text: para });
            }
            Event::Start(Tag::BlockQuote(_)) => {
                let blocks = parse_block(iter, Some(TagEnd::BlockQuote));
                v.push(MarkdonwBlock::Quote {
                    quote_children: blocks,
                });
            }
            Event::Start(Tag::Heading { level, .. }) => {
                let text = parse_inline(iter, TagEnd::Heading(level));
                v.push(MarkdonwBlock::Heading {
                    level: level as usize,
                    text,
                });
            }
            Event::Start(Tag::CodeBlock(kind)) => {
                let lang = if let CodeBlockKind::Fenced(lang) = kind {
                    Some(format!("{lang}"))
                } else {
                    None
                };
                let mut code = String::new();
                while let Some(e) = iter.next() {
                    match e {
                        Event::Code(c) => code.push_str(&c),
                        Event::Text(c) => code.push_str(&c),
                        Event::End(TagEnd::CodeBlock) => break,
                        _ => (),
                    }
                }
                v.push(MarkdonwBlock::BlockCode { lang, code })
            }
            Event::Start(Tag::List(start_opt)) => {
                if let Some(start) = start_opt {
                    let children = parser_list(iter, true);
                    v.push(MarkdonwBlock::Ol { start, children });
                } else {
                    let children = parser_list(iter, false);
                    v.push(MarkdonwBlock::Ul { children });
                }
            }
            Event::Rule => v.push(MarkdonwBlock::Rule),
            _ => (),
        }
    }
    v
}

pub fn parse_markdown(markdown_text: &str) -> Vec<MarkdonwBlock> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_MATH);
    options.insert(Options::ENABLE_SMART_PUNCTUATION);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_SMART_PUNCTUATION);
    let mut parser = Parser::new_ext(markdown_text, options);
    parse_block(&mut parser, None)
}
