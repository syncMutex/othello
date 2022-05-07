export function randInt(min:number, max:number):number {
  return Math.floor(Math.random() * (max - min) + min)
}

function saveRandomNameToLocalStorage() {
  window.localStorage.userName = `Player_${randInt(0, 10)}${randInt(0, 10)}${randInt(0, 10)}${randInt(0, 10)}`
}

export function validateUserName() {
  if(!window.localStorage.userName) saveRandomNameToLocalStorage();
}