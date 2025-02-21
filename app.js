const { fromEvent, of, forkJoin } = rxjs;
const { debounceTime, map, switchMap, catchError } = rxjs.operators;

const input = document.getElementById('search-input');
const resultsContainer = document.getElementById('autocomplete-results');

// API Endpoints
const endpoints = [
    'https://catfact.ninja/fact',
    'https://www.boredapi.com/api/activity',
    'https://official-joke-api.appspot.com/random_joke'
];

// Function to fetch data from each endpoint
const fetchData = (url) => {
    return fetch(url)
        .then(response => response.json())
        .catch(() => null); // Return null in case of error
};

// Function to combine results
const combineResults = (responses) => {
    const combined = [];

    responses.forEach(response => {
        if (!response) return; // Skip if response is null

        if (response.fact) {
            // Cat Facts API
            combined.push(`Cat Fact: ${response.fact}`);
        } else if (response.activity) {
            // Bored API
            combined.push(`Activity: ${response.activity}`);
        } else if (response.setup && response.punchline) {
            // Joke API
            combined.push(`Joke: ${response.setup} - ${response.punchline}`);
        }
    });

    return combined;
};

// Observable for input events
fromEvent(input, 'input')
    .pipe(
        debounceTime(300),
        map(event => event.target.value.trim()),
        switchMap(query => {
            if (!query) {
                return of([]);
            }
            // Make simultaneous requests to all endpoints
            const requests = endpoints.map(endpoint => fetchData(endpoint));
            return forkJoin(requests).pipe(
                map(combineResults),
                catchError(() => of([]))
            );
        })
    )
    .subscribe(results => {
        // Clear previous results
        resultsContainer.innerHTML = '';

        // Display new results
        results.forEach(result => {
            const li = document.createElement('li');
            li.textContent = result;
            resultsContainer.appendChild(li);
        });
    });
