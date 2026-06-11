package goroutine

import (
	"log"
	"runtime/debug"
)

func Safe(fn func()) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[PANIC] goroutine recovered: %v\n%s", r, debug.Stack())
			}
		}()
		fn()
	}()
}
