'use strict';

const form = document.querySelector('.form');
const container = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  
  constructor(coords, distance, duration) {
    this.coords = coords;     // [lat, lng]
    this.distance = distance; // in kilometers
    this.duration = duration; // in minutes
  }
  
  _setDescription(){
    // prettier-ignore
    const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
  }
}

class Running extends Workout {
    type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
    calcPace(){
        this.pace = this.duration / this.distance;
        return this.pace; 
    }
}

class Cycling extends Workout {
    type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed(){
    this.speed = this.distance / (this.duration/60);
  }
}

//  APPLICATOIN ARCHITECTURE 
class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;

  constructor() {
    // GET NAVIGATOR LOCATION
    this._getPosition();

    // STORE LOCAL STORAGE
    this._getLocalStorage();

    // ADD EVENT LISTENER
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    container.addEventListener('click', this._moveToPopup.bind(this))
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(`Could not get your position`);
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work =>{
        this._renderWorkoutMarker(work);
    })
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm(){
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(()=> form.style.display = 'grid', 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const allPositive=  (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault();


    //  GET DATA FROM THE FORM 
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    // CHECK IF DATA IS VALID 

    // IF WORKOUT IS RUNNING, CREATE RUNNING OBJECT
    if(type === 'running'){
        const cadence = +inputCadence.value;
        if(!validInputs(distance, duration,cadence)|| !allPositive(distance, duration, cadence) )
            return alert(`Input has to be a positive number`);

         workout = new Running([lat, lng], distance, duration, cadence)
       
    }

    // IF WORKOUT IS CYCKING, CREATE CYCLING OBJECT 
    if(type === 'cycling'){
        const elevation = +inputElevation.value;
       if(!validInputs(distance, duration,elevation)|| !allPositive(distance, duration) )
            return alert(`Input has to be a positive number`)

        workout = new Cycling([lat, lng], distance, duration, elevation)
    }

    // ADD NEW OBJECT TO WORKOUT ARRAY 
        this.#workouts.push(workout)
        console.log(workout)
    // RENDER WORKOUT ON MAP AS MARKER
        this._renderWorkoutMarker(workout)
        this._renderWorkout(workout);
        this._hideForm();
        this._setLocalStorage();
    

    // RENDER WORKOUT ON THE LIST 

    // HIDE THE FORM AND CLEAR INPUT FIELDS

    // SET LOCAL STORAGE TO ALL WORKOUTS
        
  }

  _renderWorkoutMarker(workout){
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup('Workout', {
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
      })
      .setPopupContent(`${workout.type === 'running'? '🏃‍♂️': '🚴‍♀️'} ${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout){
    let html = ` <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running'? '🏃‍♂️': '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`
        if(workout.type === 'running')
          html += `
         <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`

              if(workout.type === 'cycling')
          html += `
         <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;

        form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e){
    const workoutEl = e.target.closest('.workout')
    console.log(workoutEl);

    if(!workoutEl) return;

    const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
    console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoomLevel,{
        animate:true,
        pan: {
            duration: 1
        }
    })

    }

      _setLocalStorage() {
        localStorage.setItem('workout',JSON.stringify(this.#workouts))
  }

      _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workout'))
        console.log(data);

        if(!data) return;
        this.#workouts = data;

        this.#workouts.forEach(work =>{
            this._renderWorkout(work)
        })
      }

      reset(){
        localStorage.removeItem('workout')
        location.reload();
      }
}
  


const app = new App();



