let cc: string = '121212';

let nn: number  = 123;

enum SomeType {
    animal,
    plant,
}

interface Some {
    name: string;
    age: number;
}
function go(data: Some) : string {
    console.log(data.name);
    return `I am ${data.name}, ${data.age} years old`;
}

let out: string = go({
    name: 'xxx',
    age: 20,
});
