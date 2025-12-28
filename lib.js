export class Dictionary {
    dict = {};
    /**
     * @description Indicates whether the dictionary has finished loading from a URL.
     * @example
     * null - not started loading
     * false - loading in progress
     * true - loading complete
     */
    dictLoadedFromLink = null;


    constructor(categories) {
        for(let i = 0; i < arguments.length; i++){
            this.dict[arguments[i]] = [];
        }

        this.practiceOrder = Object.keys(this.dict)
    }

    async waitForDictLoad() {
        if(this.dictLoadedFromLink == null) return false;
        while(this.dictLoadedFromLink != true) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    getAllCategories() {
        return Object.keys(this.dict);
    }

    async bulkAddFromUrl(url, entryDelimiter, definitionDelimiter, dialectDelimiter) {
        try {
            this.dictLoadedFromLink = false;
            let response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            let data = await response.text()
        
            data = data.split(entryDelimiter)
        
            data.forEach(entry => {
                entry = entry.split(definitionDelimiter);
        

                let other = entry[0].split(dialectDelimiter);
                let english = entry[1].trim();
                let category = entry[2].trim();
        
                if(!(category == "Grammar" || category == "Tenses" || category == "Phrases")){
                    other = other.map(x => x.replaceAll(" ", "-").trim())
                }
                this.addWord(category, new Word(english, ...other));
            });

            this.dictLoadedFromLink = true;
        } catch (error) {}
    }

    setPracticeOrder(args) {
        this.practiceOrder = [];
        for(let i = 0; i < arguments.length; i++){
            this.practiceOrder.push(arguments[i]);
        }
    }

    addWord(category, word) {
        for(let i = 1; i < arguments.length; i++){
            if(!arguments[i] instanceof Word) throw new Error("All arguments must be of type Word");
            if(this.dict[category] === undefined){
                this.dict[category] = [];
            }
            arguments[i].category = category;
            this.dict[category].push(arguments[i]);
        }
    }

    /**
     * 
     * @param {string} searchTerm the english term to search by
     * @param {Object} [options] an object that can have the following properties:
     * @param {string} [options.dialect=undefined] the dialect to return the word in, if not specified, all dialects will return
     * @param {string} [options.category=undefined] the category to search in, if not specified, all categories will be searched
     * @param {boolean} [options.swap=false] if true, the term input should be in the language other than english
     * @param {Object} [options.excludedCategories=[]] an array of categories to exclude from the search
     * @returns {WordSearchResult} an array of Word objects that match the search term, optionally filtered by category and dialect
     * @example 
     *  dict.waitForDictLoad().then(() => {
     *      let wordSearchResult = dict.wordSearch("a", {
     *          dialect: "Standard",
     *          category: "Religious Terms",
     *          swap: false,
     *          excludedCategories: ["Cannibals and Mutants"]
     *      })
     *
     *      console.log(wordSearchResult)
     *  })
     */
    wordSearch(searchTerm, options) {
        searchTerm = searchTerm.toLowerCase();

        let category = options?.category || undefined;
        let dialect = options?.dialect || undefined;
        let swap = options?.swap || false;
        let excludedCategories = options?.excludedCategories || [];
        let regexSearch = options?.regexSearch || false;

        if(["not loaded", "loading"].includes(this.dictLoadedFromLink)) throw new Error("Dictionary not loaded yet. Please wait for the dictionary to load before searching.");

        let results = [];

        if(swap == false){
            if(category == undefined) {
                for(let i = 0; i < this.practiceOrder.length; i++){
                    let cat = this.practiceOrder[i];
                    this.dict[cat].forEach(word => {
                        if (regexSearch ? new RegExp(searchTerm, "i").test(word.key) : word.key.includes(searchTerm)) {
                            let word_ = new Word(word.key, ...Object.values(word.value));
                            word_.category = cat;
                            results.push(word_);
                        }
                    })
                }
            } else {
                if(this.dict[category] == undefined) return new WordSearchResult(searchTerm, []);
                this.dict[category].forEach(word => {
                    if (regexSearch ? new RegExp(searchTerm, "i").test(word.key) : word.key.includes(searchTerm)) {
                        let word_ = new Word(word.key, ...Object.values(word.value))
                        word_.category = category;
                        results.push(word_);
                    }
                })
            }
        } else {
            if (!category) {
                for (let i = 0; i < this.practiceOrder.length; i++) {
                    let cat = this.practiceOrder[i];
                    this.dict[cat].forEach(word => {
                        if (dialect == undefined 
                            ? regexSearch 
                                ? Object.values(word.value).some(value => new RegExp(searchTerm, "i").test(value)) 
                                : Object.values(word.value).some(value => value.includes(searchTerm)) 
                            : regexSearch
                                ? new RegExp(searchTerm, "i").test(word.value[dialect])
                                : word.value[dialect].includes(searchTerm)
                        ) {
                            let word_ = new Word(word.key, ...Object.values(word.value));
                            word_.category = cat;
                            results.push(word_);
                        }
                    });
                }
            } else {
                if (!this.dict[category]) return new WordSearchResult(searchTerm, []);
                this.dict[category].forEach(word => {
                    if (dialect == undefined
                        ? regexSearch
                            ? Object.values(word.value).some(value => new RegExp(searchTerm, "i").test(value))
                            : Object.values(word.value).some(value => value.includes(searchTerm))
                        : regexSearch
                            ? new RegExp(searchTerm, "i").test(word.value[dialect])
                            : word.value[dialect].includes(searchTerm)
                        ) {
                        let word_ = new Word(word.key, ...Object.values(word.value));
                        word_.category = category;
                        results.push(word_);
                    }
                });
            }
        }

        if(dialect != undefined){
            for(let i = 0; i < results.length; i++){
                let term = results[i];
                for(let j = 0; j < Object.keys(term.value).length; j++){
                    if(Object.keys(term.value)[j] != dialect){
                        delete term.value[Object.keys(term.value)[j]];
                    }
                }
            }
        }

        results = results.filter(x => !excludedCategories.includes(x.category));

        return new WordSearchResult(searchTerm, results, excludedCategories);
    }

    /**
     * 
     * @param {string} location the location to open the dictionary to. 
     * @param {Object} [options] an object that can have the following properties:
     * @param {number} [options.width=850] the width of the dictionary window (element, window)
     * @param {number} [options.height=950] the height of the dictionary window (element, window)
     * @param {HTMLElement} [options.element=undefined] the element to open the dictionary in (element)
     * @param {string[]} [options.exclude=[]] an array of categories to exclude from the dictionary. The categories will be the index they are in the this.practiceOrder array (element, window, tab)
     * @param {string} [options.removeNav=false] remove search, dialect changing, swap (element, window, tab)
     * @param {string} [options.removeCategoryColumn=false] remove the category column (element, window, tab)
     * @param {string} [options.dialect=undefined] the dialect to open the dictionary in (element, window, tab)
     */

    //width, height, element, exclude
    openDictionary(type, options) {
        let width = options?.width || 850;
        let height = options?.height || 950;
        let element = options?.element || undefined;
        let exclude = options?.exclude || [];
        let removeNav = options?.removeNav || false;
        let removeCategoryColumn = options?.removeCategoryColumn || false;
        let dialect = options?.dialect || undefined;

        switch(type) {
            case "element":
                let urlParams = [
                    "b=false",
                    `e=${exclude.join(",")}`,
                    `n=${removeNav}`,
                    `c=${removeCategoryColumn}`,
                    `d=${dialect}`
                ]
                let elem = element;
                elem.src = `https://rus1130.github.io/ngimete/dictionary.html?${urlParams.join("&")}`;
                elem.style.height = height;
                elem.style.width = width;
                elem.style.border = "none";
            break;
            case "window":
                // open it in a new window
                window.open(`https://rus1130.github.io/ngimete/dictionary.html?b=false`, "_blank", `height=${width},width=${width}`);
            break;
            default:
            case "tab":
                window.open("https://rus1130.github.io/ngimete/dictionary.html");
            break;

        }
    }

    // 850, 950

    get categories() {
        return this.dict.map(x => x.name);
    }
}

function ortho(s){
    const V = ["a", "e", "i", "o", "u", "á", "é", "í", "ó", "ú", "ä", "ë", "ü"]
    const C = ["b", "d", "f", "g", "h", "k", "l", "m", "n", "p", "s", "t", "v", "w", "y", "r"]
    const C1 = ["m", "n", "s", "v", "w", "r"]
    const A = ["b", "d", "f", "h", "k", "l", "t"]
    const D = ["g", "p", "y"]
    const P = ["o", "i", "u"]


    for(let i = 0; i < s.length; i++){

        if(s[i] == "-"){
            let left = s[i-1]
            let right = s[i+1]
            
            // C-C = ə
            // P-C = ə
            // V-V = c
            // V-C1 = z
            // V-D = c
            // V-A = z
            // a-C = ā

            if(left == "a" && C.includes(right)) {
                s = s.substring(0, i) + "ā" + s.substring(i+1)
                continue
            }
            if(V.includes(left) && D.includes(right)) {
                s = s.substring(0, i) + "c" + s.substring(i+1)
                continue
            }
            if(P.includes(left) && C.includes(right)) {
                s = s.substring(0, i) + "ə" + s.substring(i+1)
                continue
            }
            if(C.includes(left) && C.includes(right)) {
                s = s.substring(0, i) + "ə" + s.substring(i+1)
                continue
            }
            if(V.includes(left) && V.includes(right)) {
                s = s.substring(0, i) + "c" + s.substring(i+1)
                continue
            }
            if(V.includes(left) && C1.includes(right)) {
                s = s.substring(0, i) + "z" + s.substring(i+1)
                continue
            }
            if(V.includes(left) && A.includes(right)) {
                s = s.substring(0, i) + "z" + s.substring(i+1)
                continue
            }
        }
    }

    s = s.replaceAll("aā", "ā")
    return s;
}

// function ipa(s){
//     s = ortho(s);

//     console.log(s)

//     const r = [
//         [   
//             // replace combining vowels with their combined counterparts
//             { pattern: "á", value: "á" },
//             { pattern: "é", value: "é" },
//             { pattern: "í", value: "í" },
//             { pattern: "ó", value: "ó" },
//             { pattern: "ú", value: "ú" },
//             { pattern: "ä", value: "ä" },
//             { pattern: "ë", value: "ë" },
//             { pattern: "ü", value: "ü" },

//             { pattern: "ngg", value: "ᵑg" },
//             { pattern: "mbb", value: "m.b" },
//             { pattern: "ndd", value: "n.d" },
//             { pattern: ".", value: " ||"},
//             { pattern: ",", value: " |"}
//         ],
//         [
//             // delimiters 
//             { pattern: "ā", value: "a‿"},
//             { pattern: "c", value: "‿"},
//             { pattern: "ə", value: "‿"},
//             { pattern: "z", value: "‿"},

//             // consonants
//             { pattern: 'ng', value: "ŋ" },
//             { pattern: 'y', value: "j" },
//             { pattern: "gy", value: "c"},
//             { pattern: "ky", value: "c"},
//             { pattern: "'", value: "ʔ" },
//             { pattern: "nd", value: "ⁿd" },
//             { pattern: "mb", value: "ᵐb" },
//             { pattern: "ts", value: "t͡s" },

//             // vowels
//             { pattern: 'a', value: "a." },
//             { pattern: 'e', value: "e." },
//             { pattern: 'i', value: "i." },
//             { pattern: 'o', value: "o." },
//             { pattern: 'u', value: "u." },
//             { pattern: 'á', value: "aː." },
//             { pattern: 'é', value: "eː." },
//             { pattern: 'í', value: "iː." },
//             { pattern: 'ó', value: "oː." },
//             { pattern: 'ú', value: "uː." },
//             { pattern: 'är', value: "ɑː." },
//             { pattern: 'ä', value: "ɑ." },
//             { pattern: 'ë', value: "ə." },
//             { pattern: 'ü', value: "y." },
//         ],
//         [
//             { pattern: ". ", value: " "},
//             { pattern: "a.o", value: "ao̯"},
//             { pattern: "e.o", value: "eo̯"},
//         ]
//     ]

//     let result = s;
//     const map = m => Object.fromEntries(m.map(({ pattern, value }) => [pattern, value]))

//     for(let i = 0; i < r.length; i++){
//         result = result.replace(new RegExp(Object.keys(map(r[i])).join("|"), "g"), match => map(r[i])[match] || match)
//     }

//     result = result.split(" ")
//     result.forEach((index, i) => {
//         if(result[i][result[i].length - 1] == ".") {
//             result[i] = result[i].substring(0, result[i].length - 1)
//         }
//     });

//     const V = "aeiouːɑəy";
//     const C = "bdfghklmnpstvwjcŋʔ";

//     result.forEach((index, i) => {            
//         // fix delimited syllable boundaries 
//         result[i] = index.replaceAll(new RegExp(`([${C+V}]ː?)(\.)([${C}])(‿)`, "g"), "$1$3$4")   

//         // fix non-delimited syllable boundaries
//         result[i] = result[i].replaceAll(new RegExp(`([${C+V}]ː?)(\.)([${C}])$`, "g"), "$1$3") 

//         // fix nasal syllable boundaries le.ŋki -> leŋ.ki
//         result[i] = result[i].replaceAll(new RegExp(`(\.)([mnŋ])([${C}])`, "g"), "$2.$3")

//         // fix w/l syllable boundaries
//         result[i] = result[i].replaceAll(new RegExp(`(\.)([wl])([${C}])`, "g"), "$2.$3")
//         result[i] = result[i].replaceAll(new RegExp(`(\.)([wl])$`, "g"), "$2")

//         // fix s syllable boundaries
//         result[i] = result[i].replaceAll(new RegExp(`([${V}])\.s$`, "g"), "$1s.")
//         result[i] = result[i].replaceAll(new RegExp(`([${V}]).s‿`, "g"), "$1s‿")

//         // fix .m.b and .n.d
//         result[i] = result[i].replaceAll(".m.b", "m.b")
//         result[i] = result[i].replaceAll(".n.d", "n.d")

//         // fix velar prenasalized syllable boundaries
//         //result[i] = result[i].replaceAll(new RegExp(`\.ŋg`, "g"), "ᵑg\.");
//     })

//     result = result.join(" ")

//     result = result
//     .replaceAll("n", "n̪")
//     .replaceAll("g", "ɡ")
//     .replaceAll("./","/")
//     .replaceAll(".​", "")
//     .replaceAll(". ", " ")
//     .replaceAll("‿", ".")
//     .replaceAll(/\.$/g, "")

//     return "[" + result + "]";
// }

function normalize(str) {
    return str.normalize("NFC");
}

function applyRules(str, rules) {
    for (const { re, to } of rules) {
        str = str.replace(re, to);
    }
    return str;
}

const ORTHO_RULES = [
    // multigraphs first
    { re: /mbb/g, to: "M" }, // m.b
    { re: /ndd/g, to: "N" }, // n.d
    { re: /gy|ky/g, to: "c" },
    { re: /ts/g, to: "S" }, // t͡s
    { re: /y/g, to: "j" },
    { re: /\?/g, to: "." },
    { re: /\!/g, to: "." },

    // prenasalization
    { re: /nd/g, to: "D" }, // ⁿd
    { re: /mb/g, to: "B" }, // ᵐb
    { re: /ngg/g, to: "G" }, // ᵑg
    { re: /ng/g, to: "ŋ" },

    // glottal
    { re: /'/g, to: "ʔ" },

    // vowels
    { re: /a/g, to: "a" },
    { re: /e/g, to: "e" },
    { re: /i/g, to: "i" },
    { re: /o/g, to: "o" },
    { re: /u/g, to: "u" },
    { re: /á/g, to: "A" }, // aː
    { re: /é/g, to: "E" }, // eː
    { re: /í/g, to: "I" }, // iː
    { re: /ó/g, to: "O" }, // oː
    { re: /ú/g, to: "U" }, // uː

    { re: /ä/g, to: "ɑ" },
    { re: /ë/g, to: "ə" },
    { re: /ü/g, to: "y" },
    { re: /är/g, to: "Q" }, // ɑː

    { re: /\.\./g, to: "." },
];

const remap = [
    { re: /A/g, to: "aː" },
    { re: /E/g, to: "eː" },
    { re: /I/g, to: "iː" },
    { re: /O/g, to: "oː" },
    { re: /U/g, to: "uː" },
    { re: /Q/g, to: "ɑː" },
    { re: /B/g, to: "ᵐb" },
    { re: /D/g, to: "ⁿd" },
    { re: /G/g, to: "ᵑɡ" },
    { re: /S/g, to: "t͡s" },
    { re: /M/g, to: "m.b" },
    { re: /N/g, to: "n.d" },
    { re: /\.\./g, to: "" },
]

const GROUPS = {
    "1": "aeiouɑəyAEIOUQ", // V
    "2": "bdfghklmnpstvwjcŋʔMNSBDG", // C
    "3": "mnŋ", // N
    "4": "s", // S
};

const SYLLABLES = [
    "214",
    "(2)1(3)",
    "(2)1",
];

function syllabifyWord(word, groups, templates) {
    const compiled = templates
        .map(t => compileTemplate(t, groups))
        .sort((a, b) => b.source.length - a.source.length);

    let out = [];
    let i = 0;

    while (i < word.length) {
        let slice = word.slice(i);
        let matched = false;

        for (const re of compiled) {
            const m = slice.match(re);
            if (m) {
                out.push(m[0]);
                i += m[0].length;
                matched = true;
                break;
            }
        }

        if (!matched) {
            // fallback: consume one char to avoid infinite loop
            out.push(word[i]);
            i++;
        }
    }

    return out.join(".");
}

const IPA_FIXES = [
    { re: /n/g, to: "n̪" },
    //{ re: /ŋ.g/g, to: ".ᵑg" },

    { re: /g/g, to: "ɡ" },
    { re: /a\.o/g, to: "ao̯" },
    { re: /e\.o/g, to: "eo̯" },
];

function compileTemplate(tpl, groups) {
    let re = "^";

    for (let i = 0; i < tpl.length; i++) {
        const ch = tpl[i];

        if (groups[ch]) {
            re += `[${groups[ch]}]`;
        } else if (ch === "(") {
            re += "(?:";
        } else if (ch === ")") {
            re += ")?";
        }
    }

    return new RegExp(re);
}


function ipa(input) {
    let s = normalize(ortho(input));

    s = s.replaceAll(".", "||");
    s = s.replaceAll(",", "|");

    s = s.replaceAll("z", ".");
    s = s.replaceAll("c", ".");
    s = s.replaceAll("ə", ".");
    s = s.replaceAll("ā", "a.");

    s = applyRules(s, ORTHO_RULES);

    s = s
        .split(" ")
        .map(s => syllabifyWord(s, GROUPS, SYLLABLES))
        .join(" ");
    
    s = s
        .replaceAll(/([mnŋ])\.([aeiouɑəyAEIOUQ])/g, ".$1$2")
        .replaceAll(/(\.?)f\.w/g, "$1fw")
        .replaceAll(/\.([MN])/g, "$1")
        .replaceAll(
        /([bdfghklmnpstvwjcŋʔMNSBDG])([aeiouɑəyAEIOUQ])\.s(?=[^aeiouɑəyAEIOUQ]|$)/g,
        "$1$2s"
    )
    s = applyRules(s, IPA_FIXES);

    s = s
        .replaceAll("...", ".")
        .replaceAll(" ..", ".");

    s = applyRules(s, remap);
    
    s = s
        .replaceAll("ɑ.r", "ɑː")
        .replaceAll(".|.|", " || ")
        .replaceAll(".|", " | ")


    let result = `[${s}]`


    result = result
        .replaceAll(" || ]", "]")
        .replaceAll(" | ]", "]")
        .replaceAll(" ||  ", " || ")
        .replaceAll(" |  ", " | ")


    return result;
}

function renderGlyph(character) {
    if(character.raw) return character.base;

    if(character.multi){
        return character.parts.map(part => renderGlyph(part)).join("");
    }

    let base = character.base;
    if(character.left)   base += mods.left;
    if(character.top)    base += mods.top;
    if(character.special)base += mods.special;
    if(character.bottom) base += mods.bottom;
    if(character.right)  base += mods.right;
    return base;
}

function findMergeTarget(pipeline) {
    for (let i = pipeline.length - 1; i >= 0; i--) {
        const g = pipeline[i];
        if (g.raw) return null;
        if (!g.vowel) return { glyph: g, index: i };
    }
    return null;
}

const mods = {
    left: "ᨙ",
    top: "ᨗ",
    bottom: "ᨘ",
    right: "ᨚ",
    special: "ᨛ",
}

/**
 * 
 * @param {*} s 
 * @param {number} type 0 = normal; 1 = merged; 2 = abugidized
 * @returns 
 */
function script(s, type = 0){
    const old_s = String(s);

    s = 
        s.replaceAll("ā", "aᨐ")
        .replaceAll("c", "ᨐ")
        .replaceAll("ə", "ᨐ")
        .replaceAll("z", "ᨐ");

    const script_map = {
        p: { base: "ᨃ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        b: { base: "ᨃ", top: false, bottom: true,  left: false, right: false, special: false, vowel: false },
        t: { base: "ᨈ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        d: { base: "ᨊ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        C: { base: "ᨇ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        k: { base: "ᨍ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        g: { base: "ᨍ", top: false, bottom: true,  left: false, right: false, special: false, vowel: false },
        Q: { base: "ᨀ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        B: { base: "ᨃ", top: false, bottom: false,  left: true, right: false, special: false, vowel: false },
        D: { base: "ᨈ", top: false, bottom: false,  left: true, right: false, special: false, vowel: false },
        G: { base: "ᨍ", top: false, bottom: false,  left: true, right: false, special: false, vowel: false },
        m: { base: "ᨅ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        n: { base: "ᨄ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        N: { base: "ᨋ", top: false, bottom: false,  left: false, right: false, special: false, vowel: false },
        f: { base: "ᨂ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        v: { base: "ᨂ", top: false, bottom: true,  left: false, right: false, special: false, vowel: false },
        s: { base: "ᨆ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        h: { base: "ᨀ", top: false, bottom: true, left: false, right: false, special: false, vowel: false },
        T: { base: "ᨉ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        w: { base: "ᨏ", top: false, bottom: false,  left: false, right: false, special: false, vowel: false },
        y: { base: "ᨒ", top: false, bottom: false,  left: false, right: false, special: false, vowel: false },
        l: { base: "ᨓ", top: false, bottom: false,  left: false, right: false, special: false, vowel: false },
        i: { base: "ᨔ", top: true,  bottom: false, left: false, right: false, special: false, vowel: true  },
        ü: { base: "ᨔ", top: true, bottom: false,  left: false, right: false, special: true, vowel: true  },
        í: { base: "ᨖ", top: true, bottom: false,  left: false, right: false, special: false, vowel: true  },
        u: { base: "ᨔ", top: true,  bottom: false, left: false, right: true, special: false, vowel: true  },
        ú: { base: "ᨖ", top: true,  bottom: false, left: false, right: true, special: false, vowel: true  },
        e: { base: "ᨔ", top: false,  bottom: false,  left: true, right: false, special: false, vowel: true  },
        é: { base: "ᨖ", top: false,  bottom: false,  left: true, right: false, special: false, vowel: true  },
        ë: { base: "ᨔ", top: false, bottom: false,  left: false, right: false, special: true, vowel: true  },
        o: { base: "ᨔ", top: false,  bottom: false, left: false, right: true, special: false, vowel: true  },
        ó: { base: "ᨖ", top: false,  bottom: false, left: false, right: true, special: false, vowel: true  },
        a: { base: "ᨔ", top: false,  bottom: false, left: false, right: false, special: false, vowel: true  },
        á: { base: "ᨖ", top: false,  bottom: false, left: false, right: false, special: false, vowel: true  },
        ä: { base: "ᨔ", top: false, bottom: true,  left: false, right: false, special: false, vowel: true  },
        är: { base: "ᨖ", top: false, bottom: true,  left: false, right: false, special: false, vowel: true  },
        X: { multi: true, parts: [
            { base: "ᨅ", top: false, bottom: false, left: false, right: false, special: false, vowel: false }, // m
            { base: "ᨃ", top: false, bottom: true,  left: false, right: false, special: false, vowel: false } // b
        ] },
        Y: { multi: true, parts: [
            { base: "ᨄ", top: false, bottom: false, left: false, right: false, special: false, vowel: false }, // n
            { base: "ᨊ", top: false, bottom: false, left: false, right: false, special: false, vowel: false } // d
        ] },
    }

    const script_replace_list = {
        "mbb": "X",
        "ndd": "Y",
        "mb": "B",
        "nd": "D",
        "ngg": "G",
        "ng": "N",
        "ts": "T",
        "gy": "C",
        "ky": "C",
        "'": "Q",
        ",": " ᨞",
        ".": " ᨟",
        "?": " ᨟",
        "!": " ᨟",
    }

    for(const [key, value] of Object.entries(script_replace_list)){
        s = s.replaceAll(key, value)
    }


    let rendered = ""

    if(type == 0){
        for(let i = 0; i < s.length; i++){
            let char = s[i];
            const renderable = script_map[char];
            if(renderable != undefined){
                rendered += renderGlyph(renderable);
            } else {
                rendered += char;
            }
        }
    }

    if (type == 1) {
        let renderPipeline = [];

        for (let i = 0; i < s.length; i++) {
            const char = s[i];
            const curr = script_map[char];

            if(i == 0){
                renderPipeline.push(curr ?? {raw: true, base: char});
                continue;
            }

            if(curr == undefined){
                renderPipeline.push({raw: true, base: char});
                continue;
            }

            if(renderPipeline[renderPipeline.length - 1]?.raw){
                renderPipeline.push(curr);
                continue;
            }

            if (curr.special) {
                // skip merging, render normally
                renderPipeline.push(curr);
                continue;
            }

            if(curr.base == "ᨑ"){
                // skip merging, render normally
                renderPipeline.push(curr);
                continue;
            }

            const currHasDiacritics =
                curr.top || curr.bottom || curr.left || curr.right || curr.special;

            if(curr.vowel && currHasDiacritics){
                // attempt to merge with previous
                const target = findMergeTarget(renderPipeline);

                if (!target) {
                    renderPipeline.push(curr);
                    continue;
                }

                const { glyph: prev, index } = target;

                const slotBlocked =
                    (curr.top && prev.top) ||
                    (curr.bottom && prev.bottom) ||
                    (curr.left && prev.left) ||
                    (curr.right && prev.right) ||
                    (curr.special && prev.special);

                if(!slotBlocked){

                    const vowelBaseIsᨖ = curr.base.startsWith("ᨖ");

                    if(prev.multi){
                        // merge onto last part
                        const lastIndex = prev.parts.length - 1;
                        const lastPart = prev.parts[lastIndex];

                        prev.parts[lastIndex] = {
                            ...lastPart,
                            top: lastPart.top || curr.top,
                            bottom: lastPart.bottom || curr.bottom,
                            left: lastPart.left || curr.left,
                            right: lastPart.right || curr.right,
                            special: lastPart.special || curr.special,
                            vowel: false
                        };

                        renderPipeline[index] = prev;

                    } else {
                        // normal merge
                        renderPipeline[index] = {
                            base: prev.base,
                            top: prev.top || curr.top,
                            bottom: prev.bottom || curr.bottom,
                            left: prev.left || curr.left,
                            right: prev.right || curr.right,
                            special: prev.special || curr.special,
                            vowel: false,
                        };
                    }

                    if(vowelBaseIsᨖ){
                        renderPipeline.push({
                            raw: true,
                            base: "ᨑ",
                        });
                    }


                    continue;
                }
            }

            // normal render
            renderPipeline.push(curr);
        }

        rendered = renderPipeline.map(renderGlyph).join("");
    }

    if (type == 2) {
        let abugidaOutput = "";

        // split by space or .
        const cleaned = ipa(old_s)
            .replace(/[\[\]\|]/g, "")      // remove [, ], |
            .trim()
            .split(/[.\s]+/)               // split by any space or period
            .filter(Boolean)               // remove empty segments

        console.log(cleaned)
    }


    return rendered.replace(/ ᨟$/g, "")
}

export class ConlangContent {
    constructor(s) {
        s = s.trim().normalize("NFC").split("\n");

        this.ipa = s.map(ipa).map(line => line.replaceAll("[]", ""));
        this.ortho = s.map(ortho)
        this.script_sep = s.map(line => script(ortho(line), 0));
        this.script_mer = s.map(line => script(ortho(line), 1));
    }

    /**
     * 
     * @param {Number} scriptType - 0 = separate, 1 = condensed
     * @param {Boolean} alternateMode - if true, outputs in alternating lines per word
     * @param {String[]} includedCategories  - categories to include: "ortho", "script", "ipa"
     * @returns 
     */
    toString(scriptType = 0, alternateMode = false, includedCategories = ["ortho", "script", "ipa"]) {
        let string = "";

        // Helper to check if a category is included
        const include = (cat) => includedCategories.includes(cat);

        if (alternateMode) {
            for (let i = 0; i < this.ipa.length; i++) {
                if (include("ortho")) string += this.ortho[i] + "\n";
                if (include("script")) string += (scriptType === 0 ? this.script_sep[i] : this.script_mer[i]) + "\n";
                if (include("ipa")) string += this.ipa[i] + "\n";
            }
        } else {
            if (include("ortho")) string += this.ortho.join("\n") + "\n";
            if (include("script")) string += (scriptType === 0 ? this.script_sep.join("\n") : this.script_mer.join("\n")) + "\n";
            if (include("ipa")) string += this.ipa.join("\n").replaceAll("[]", "\n");
        }

        return string.trim().replaceAll("\n\n\n", "\n\n");
    }
}

export class Writer {
    constructor(text){
        this.text = text.trim().normalize("NFC");
    }

    ipa(){
        return this.text.split("\n").map(ipa).join("\n").replaceAll("[]", "\n")
    }

    ortho(){
        return ortho(this.text)
    }

    // ᨈ ᨔᨙ ᨃᨙ ᨃᨘ ᨔᨙ
    // t  e mb b e

    /**
     * 
     * @param {Number} type 0 = separate, 1 = condensed
     * @returns 
     */
    script(type = 0){
        return script(this.ortho(), type)
    }

    all(alternateMode = false){
        return this.both(alternateMode)
    }

    both(alternateMode = false){
        if(alternateMode){
            return this.text.split("\n").map(line => {
                return `${ortho(line)}\n${ipa(line).replaceAll("[]", "")}`
            }).join("\n")
        }
        return `${this.ortho()}\n${this.ipa()}`
    }
}

export class Word {
    static setDialects(dialects = ["Standard"]) {
        Word.dialects = dialects;
    }
    
    constructor(key, value) {
        this.key = key;
        this.value = {};
        this.category = undefined;

        if(Word.dialects == undefined){
            console.warn("Dialects not set. Defaulting to \"Standard\" dialect.")
            Word.dialects = ["Standard"];
        }

        if(arguments.length - 1 < Word.dialects.length){
            this.value[Word.dialects[0]] = value;
        } else {
            for(let i = 1; i < arguments.length; i++){
                this.value[Word.dialects[i-1]] = arguments[i];
            }
        }

        // for each dialect that isnt the standard one
        Word.dialects.forEach(dialect => {
            if((this.value[dialect] == undefined)){
                this.value[dialect] = this.value["Standard"];
            }
        });
    }

    toArray() {
        return [this.key, this.value, this.category];
    }
}

export class WordSearchResult {
    constructor(searchTerm, results, excludedCategories) {
        this.searchTerm = searchTerm;
        this.results = results;
        this.excludedCategories = excludedCategories;
    }
}