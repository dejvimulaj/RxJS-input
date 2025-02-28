const { fromEvent, of, forkJoin } = rxjs;
const { debounceTime, map, switchMap, catchError } = rxjs.operators;

const input = document.getElementById('search-input');
const resultsContainer = document.getElementById('autocomplete-results');
const inputBox = document.getElementById('inputBox')
const endpoints = [
    'http://universities.hipolabs.com/search?name=',
    'https://api.agify.io?name=',
    'https://api.genderize.io?name='
];

// Caching Mechanism
const cache = new Map();

const fetchData = (url) => {
    if (cache.has(url)) {
        return Promise.resolve(cache.get(url));
    }
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            cache.set(url, data);
            return data;
        })
        .catch(() => null);
};

const combineResults = (responses) => {
    const combined = [];
    const tempMap = new Map();

    responses.forEach((response, index) => {
        if (!response) return;

        if (index === 0 && Array.isArray(response)) {
            response.forEach(university => {
                const name = university.name;
                if (!tempMap.has(name)) {
                    tempMap.set(name, { name, source: 'University', country: university.country });
                }
            });
        }

        if (index === 1 && response.age) {
            const name = response.name;
            if (tempMap.has(name)) {
                tempMap.get(name).age = response.age;
            } else {
                tempMap.set(name, { name, source: 'Age', age: response.age });
            }
        }

        if (index === 2 && response.gender) {
            const name = response.name;
            if (tempMap.has(name)) {
                tempMap.get(name).gender = response.gender;
            } else {
                tempMap.set(name, { name, source: 'Gender', gender: response.gender });
            }
        }
    });

    tempMap.forEach(value => {
        let result = `Name: ${value.name}`;
        if (value.country) result += `, University in ${value.country}`;
        if (value.age) result += `, Predicted Age: ${value.age}`;
        if (value.gender) result += `, Predicted Gender: ${value.gender}`;
        combined.push(result);
    });

    return combined;
};

fromEvent(input, 'input')
    .pipe(
        debounceTime(400), 
        map(event => event.target.value.trim()),
        switchMap(query => {
            if (query.length < 3) {
                return of([]);
            }
            const requests = endpoints.map(endpoint => fetchData(endpoint + encodeURIComponent(query)));
            return forkJoin(requests).pipe(
                map(combineResults),
                catchError(() => of([]))
            );
        })
    )
    .subscribe(results => {
        resultsContainer.innerHTML = '';
        resultsContainer.style.display = "block";
        inputBox.classList.add("active");
        results.forEach(result => {
            const li = document.createElement('li');
            li.textContent = result;
            resultsContainer.appendChild(li);
        });
    });