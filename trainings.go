package main

import (
	"encoding/csv"
	"encoding/json"
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

// event is each row in the input.
type event struct {
	Start     time.Time
	End       time.Time
	Location  string
	Country   string
	Host      string
	Event     string
	Type      string
	Language  string
	Topic     string
	Attendees int
	URL       string
}

// document is the final output
type document struct {
	Students       int
	StudentsByType map[string]int
	EventsByType   map[string]int
	Count          int
	Companies      int
	Cities         int
	Countries      int
	Events         []event
}

func main() {

	f, err := os.Open("trainings.md")
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.Comma = '|'
	r.Comment = '#'

	rows, err := r.ReadAll()
	if err != nil {
		log.Fatal(err)
	}

	doc := document{
		StudentsByType: make(map[string]int),
		EventsByType:   make(map[string]int),
	}

	for _, row := range rows[2:] {
		e := event{
			Start:     parseTime(row[0]),
			End:       parseTime(row[1]),
			Location:  strings.TrimSpace(row[2]),
			Country:   strings.TrimSpace(row[3]),
			Host:      strings.TrimSpace(row[4]),
			Event:     strings.TrimSpace(row[5]),
			Type:      strings.TrimSpace(row[6]),
			Language:  strings.TrimSpace(row[7]),
			Topic:     strings.TrimSpace(row[8]),
			Attendees: parseInt(row[9]),
			URL:       strings.TrimSpace(row[10]),
		}

		doc.Events = append(doc.Events, e)
	}

	cities := make(map[string]int)
	countries := make(map[string]int)
	companies := make(map[string]int)

	for _, e := range doc.Events {
		cities[e.Location]++
		countries[e.Country]++
		companies[e.Host]++
		doc.Students += e.Attendees
		doc.StudentsByType[e.Event+"/"+e.Type] += e.Attendees
		doc.EventsByType[e.Event+"/"+e.Type]++
	}

	doc.Cities = len(cities)
	doc.Countries = len(countries)
	doc.Companies = len(companies)
	doc.Count = len(doc.Events)

	out, err := os.Create("trainings.json")
	if err != nil {
		log.Fatal(err)
	}
	enc := json.NewEncoder(out)
	enc.SetIndent("", "\t")
	if err := enc.Encode(doc); err != nil {
		log.Fatal(err)
	}
	if err := out.Close(); err != nil {
		log.Fatal(err)
	}
}

func parseTime(s string) time.Time {
	t, err := time.Parse("Jan 02, 2006", strings.TrimSpace(s))
	if err != nil {
		log.Fatal(err)
	}
	return t
}

func parseInt(s string) int {
	s = strings.TrimSpace(s)
	if s[len(s)-1] == '?' {
		s = s[:len(s)-1]
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		log.Fatal(err)
	}
	return n
}
