export type config = {
  now_open_file_name: string | null,
}

export type image = {
  file_type: 'pdf' | 'jpeg' | 'png'
  file_name: string,
  contents: number[]
}

export type data = {
  title: string;
  book_name: string;
  url: string;
  keywords: string[];
  time_stamp: string;
  memo: string;
}

export type markdown_inline = {
  type: 'text' | 'inline_code' | 'inline_math' | 'display_math' | 'emphasis' | 'strong' | 'strike' | 'br' | 'link' | 'image',
  string: string | null,
  text: markdown_inline[] | null,
  link: string | null
}

export type markdown_block = {
  type: 'paragraph' | 'rule' | 'heading' | 'block_code' | 'quote' | 'ol' | 'ul',
  text: markdown_inline[] | null,
  start: number | null,
  level: number | null,
  lang: string | null,
  code: string | null,
  children: markdown_list[] | null,
  quote_children: markdown_block[] | null,
}

export type markdown_list = {
  type: 'ol' | 'ul' | 'item',
  children: markdown_list[] | null,
  text: markdown_inline[] | null,
  check: boolean | null,
  start: number | null,
}
