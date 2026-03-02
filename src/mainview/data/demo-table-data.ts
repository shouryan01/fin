export type Person = {
	id: number;
	name: string;
	email: string;
	visits: number;
};

export const defaultPeople: Person[] = [
	{ id: 1, name: "Ada Lovelace", email: "ada@example.com", visits: 12 },
	{ id: 2, name: "Alan Turing", email: "alan@example.com", visits: 8 },
	{ id: 3, name: "Grace Hopper", email: "grace@example.com", visits: 21 },
];
