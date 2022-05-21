package game

import "encoding/json"

type board [8][8]rune

func (b *board) JsonString() string {
	bs, _ := json.Marshal(b)
	return string(bs)
}
