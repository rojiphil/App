import type {SearchQueryJSON} from '@components/Search/types';
import {parse} from '@libs/SearchParser/autocompleteParser';
import parserCommonTests from '../utils/fixtures/searchParsersCommonQueries';

const tests = [
    {
        query: parserCommonTests.simple,
        expected: {
            autocomplete: {key: 'type', value: 'expense', start: 5, length: 7},
            ranges: [{key: 'type', value: 'expense', start: 5, length: 7}],
        },
    },
    {
        query: parserCommonTests.userFriendlyNames,
        expected: {
            autocomplete: null,
            ranges: [
                {key: 'taxRate', value: 'rate1', start: 9, length: 5},
                {key: 'expenseType', value: 'card', start: 28, length: 4},
                {key: 'cardID', value: 'Big Bank', start: 38, length: 10},
            ],
        },
    },
    {
        query: parserCommonTests.oldNames,
        expected: {
            autocomplete: null,
            ranges: [
                {key: 'taxRate', value: 'rate1', start: 8, length: 5},
                {key: 'expenseType', value: 'card', start: 26, length: 4},
                {key: 'cardID', value: 'Big Bank', start: 38, length: 10},
            ],
        },
    },
    {
        query: parserCommonTests.complex,
        expected: {
            autocomplete: {
                key: 'category',
                length: 22,
                start: 102,
                value: 'meal & entertainment',
            },
            ranges: [
                {key: 'expenseType', length: 4, start: 24, value: 'cash'},
                {key: 'expenseType', length: 4, start: 29, value: 'card'},
                {key: 'category', length: 6, start: 89, value: 'travel'},
                {key: 'category', length: 5, start: 96, value: 'hotel'},
                {key: 'category', length: 22, start: 102, value: 'meal & entertainment'},
            ],
        },
    },
    {
        query: parserCommonTests.quotesIOS,
        expected: {
            autocomplete: {
                key: 'category',
                length: 5,
                start: 22,
                value: 'a b',
            },
            ranges: [
                {key: 'type', value: 'expense', start: 5, length: 7},
                {key: 'category', value: 'a b', start: 22, length: 5},
            ],
        },
    },
    {
        // cspell:disable-next-line
        query: 'date>2024-01-01 amount>100 merchant:"A B" description:A,B,C ,, reportid:123456789 word',
        expected: {
            autocomplete: null,
            ranges: [],
        },
    },
    {
        query: ',',
        expected: {
            autocomplete: null,
            ranges: [],
        },
    },
    {
        query: 'tag:,,',
        expected: {
            autocomplete: null,
            ranges: [],
        },
    },
    {
        query: 'in:123456 currency:USD      ',
        expected: {
            autocomplete: {
                key: 'currency',
                value: 'USD',
                start: 19,
                length: 3,
            },
            ranges: [
                {key: 'in', value: '123456', start: 3, length: 6},
                {key: 'currency', value: 'USD', start: 19, length: 3},
            ],
        },
    },
    {
        query: 'tag:aa,bbb,cccc',
        expected: {
            autocomplete: {
                key: 'tag',
                value: 'cccc',
                start: 11,
                length: 4,
            },
            ranges: [
                {key: 'tag', value: 'aa', start: 4, length: 2},
                {key: 'tag', value: 'bbb', start: 7, length: 3},
                {key: 'tag', value: 'cccc', start: 11, length: 4},
            ],
        },
    },
    {
        query: 'category:',
        expected: {
            autocomplete: {
                key: 'category',
                value: '',
                start: 9,
                length: 0,
            },
            ranges: [],
        },
    },
    {
        query: 'category:Advertising,',
        expected: {
            autocomplete: {
                key: 'category',
                value: '',
                start: 21,
                length: 0,
            },
            ranges: [{key: 'category', value: 'Advertising', start: 9, length: 11}],
        },
    },
    {
        query: 'in:"Big Room","small room"',
        expected: {
            autocomplete: {
                key: 'in',
                value: 'small room',
                start: 14,
                length: 12,
            },
            ranges: [
                {key: 'in', value: 'Big Room', start: 3, length: 10},
                {key: 'in', value: 'small room', start: 14, length: 12},
            ],
        },
    },
    {
        query: 'category:   Car',
        expected: {
            autocomplete: {
                key: 'category',
                value: 'Car',
                start: 12,
                length: 3,
            },
            ranges: [{key: 'category', value: 'Car', start: 12, length: 3}],
        },
    },
    {
        query: 'type:expense word',
        expected: {
            autocomplete: null,
            ranges: [{key: 'type', value: 'expense', start: 5, length: 7}],
        },
    },
    {
        query: 'in:"Big Room" from:Friend category:Car,"Cell Phone" expense-type:card,cash',
        expected: {
            autocomplete: {
                key: 'expenseType',
                value: 'cash',
                start: 70,
                length: 4,
            },
            ranges: [
                {key: 'in', value: 'Big Room', start: 3, length: 10},
                {key: 'from', value: 'Friend', start: 19, length: 6},
                {key: 'category', value: 'Car', start: 35, length: 3},
                {key: 'category', value: 'Cell Phone', start: 39, length: 12},
                {key: 'expenseType', value: 'card', start: 65, length: 4},
                {key: 'expenseType', value: 'cash', start: 70, length: 4},
            ],
        },
    },
    {
        query: 'currency:PLN,USD keyword tax-rate:tax  merchant:"Expensify, Inc." tag:"General Overhead",IT expense-type:card,distance',
        expected: {
            autocomplete: {
                key: 'expenseType',
                value: 'distance',
                start: 110,
                length: 8,
            },
            ranges: [
                {key: 'currency', value: 'PLN', start: 9, length: 3},
                {key: 'currency', value: 'USD', start: 13, length: 3},
                {key: 'taxRate', value: 'tax', start: 34, length: 3},
                {key: 'tag', value: 'General Overhead', start: 70, length: 18},
                {key: 'tag', value: 'IT', start: 89, length: 2},
                {key: 'expenseType', value: 'card', start: 105, length: 4},
                {key: 'expenseType', value: 'distance', start: 110, length: 8},
            ],
        },
    },
    {
        query: 'from:""Big Dog","Little Dog"" to:""Mad" Dog"',
        expected: {
            autocomplete: {
                key: 'to',
                value: '"Mad" Dog',
                start: 33,
                length: 11,
            },
            ranges: [
                {key: 'from', value: '"Big Dog', start: 5, length: 10},
                {key: 'from', value: 'Little Dog"', start: 16, length: 13},
                {key: 'to', value: '"Mad" Dog', start: 33, length: 11},
            ],
        },
    },
    {
        query: 'from:““Rag” Dog”,"Bag ”Dog“" to:"""Unruly"" “““Glad””” """Dog"""',
        expected: {
            autocomplete: {
                key: 'to',
                value: '""Unruly"" “““Glad””” """Dog""',
                start: 32,
                length: 32,
            },
            ranges: [
                {key: 'from', value: '“Rag” Dog', start: 5, length: 11},
                {key: 'from', value: 'Bag ”Dog“', start: 17, length: 11},
                {key: 'to', value: '""Unruly"" “““Glad””” """Dog""', start: 32, length: 32},
            ],
        },
    },
];

describe('autocomplete parser', () => {
    test.each(tests)(`parsing: $query`, ({query, expected}) => {
        const result = parse(query) as SearchQueryJSON;

        expect(result).toEqual(expected);
    });
});
