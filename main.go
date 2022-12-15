package main

import (
	"log"
	"net/http"
	"os"
)

func determineListenAddress() (string, error) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}
	return ":" + port, nil
}

func main() {
	r := createHttpRoutes()
	addr, err := determineListenAddress()
	if err != nil {
		log.Fatal(err)
	}
	log.Println("running on port " + addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatal(err.Error())
	}
}
