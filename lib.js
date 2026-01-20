export class Dictionary {
    dict = {};
    /**
     * @description Indicates whether the dictionary has finished loading from a URL.
     * @example
     * null - not started loading
     * false - loading in progress
     * true - loading complete
     */
    ready = null;


    constructor(categories) {
        for(let i = 0; i < arguments.length; i++){
            this.dict[arguments[i]] = [];
        }

        this.practiceOrder = Object.keys(this.dict)
    }

    async waitForDictLoad() {
        if(this.ready == null) return false;
        while(this.ready != true) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    getAllCategories() {
        return Object.keys(this.dict);
    }

    /**
     * 
     * @param {string[]} excludedCategories
     * @returns 
     */
    getAllWords(excludedCategories = []) {
        let words = [];
        for (const category in this.dict) {
            if (excludedCategories.includes(category)) continue;
            words = words.concat(this.dict[category]);
        }
        return words;
    }

    async bulkAddFromUrl(url, entryDelimiter, definitionDelimiter, dialectDelimiter) {
        try {
            this.ready = false;
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

            this.ready = true;
        } catch (error) {
            this.ready = null;
            console.error("Error loading dictionary from URL:", error);
        }
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

    randomWord(category, excludeMode = false) {
        let availableCategories = this.practiceOrder;

        if (category !== undefined) {
            if (!Array.isArray(category)) category = [category];

            if (excludeMode) {
                // exclude the given categories
                availableCategories = availableCategories.filter(c => !category.includes(c));
            } else {
                // include only the given categories
                availableCategories = availableCategories.filter(c => category.includes(c));
            }
        }

        if (availableCategories.length === 0) return null;

        // pick a random category from the filtered list
        const chosenCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        const wordsInCategory = this.dict[chosenCategory];

        if (!wordsInCategory || wordsInCategory.length === 0) return null;

        let randomIndex = Math.floor(Math.random() * wordsInCategory.length);
        let randomWord = wordsInCategory[randomIndex];

        while(randomWord.key.trim() === "") {
            randomIndex = Math.floor(Math.random() * wordsInCategory.length);
            randomWord = wordsInCategory[randomIndex];
        }

        return randomWord;
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

        if(this.ready != true){
            throw new Error("Dictionary not loaded yet. Please wait for the dictionary to load before searching.");
        }

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

    allWords(excludedCategories = []) {
        let results = [];
        for(let i = 0; i < this.practiceOrder.length; i++){
            let cat = this.practiceOrder[i];
            if(excludedCategories.includes(cat)) continue;
            this.dict[cat].forEach(word => {
                let word_ = new Word(word.key, ...Object.values(word.value));
                word_.category = cat;
                results.push(word_);
            })
        }
        return results;
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

    s = s.replaceAll("_", "");

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
    { re: /M/g, to: "mb" },
    { re: /N/g, to: "nd" },

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
    { re: /M/g, to: "mb" },
    { re: /N/g, to: "nd" },
    { re: /\.\./g, to: "" },
]

const GROUPS = {
    "V": "aeiouɑəyAEIOUQ",
    "C": "bdfghklmnpstvwjcŋʔSBDG",
    "N": "mnŋ",
    "F": "fpbts",
    "T": "Ss",
};

const SYLLABLES = [
    "FwV", // (f/p/b/t)w(vowel)
    `Til(?![${GROUPS.V}])`, // (s/ts)il 
    `kid(?![${GROUPS.V}${GROUPS.C}])`, // kid not followed by vowel or consonant
    `CVN(?![${GROUPS.V}])`, // consonant-vowel-nasal not followed by vowel
    `CVN(?=[${GROUPS.C}])`, // consonant-vowel-nasal followed by consonant
    `(C)Vs(?![${GROUPS.V}${GROUPS.C}])`, // (consonant)-vowel-s not followed by vowel or consonant
    `VN(?=[${GROUPS.C}])`, // vowel-nasal followed by consonant
    "CV",
    "V"
];

function syllabifyWord(word, groups, templates) {
    const compiled = templates
        .map(t => compileTemplate(t, groups))

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
    { re: /o\.a/g, to: "oa̯" },
];

function compileTemplate(tpl, groups) {
    let re = "^";
    let i = 0;

    while (i < tpl.length) {
        const ch = tpl[i];

        // Check for lookahead patterns
        if (ch === '(' && tpl[i + 1] === '?') {
            // Find the closing paren
            let depth = 1;
            let j = i + 1;
            while (j < tpl.length && depth > 0) {
                j++;
                if (tpl[j] === '(') depth++;
                if (tpl[j] === ')') depth--;
            }
            // Copy the entire lookahead as-is
            re += tpl.slice(i, j + 1);
            i = j + 1;
        } else if (groups[ch]) {
            re += `[${groups[ch]}]`;
            i++;
        } else if (ch === "(") {
            re += "(?:";
            i++;
        } else if (ch === ")") {
            re += ")?";
            i++;
        } else {
            re += ch;
            i++;
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

    s = s.replaceAll("är", "Q");

    s = applyRules(s, ORTHO_RULES);

    s = s
        .split(" ")
        .map(s => syllabifyWord(s, GROUPS, SYLLABLES))
        .join(" ");


    s = applyRules(s, IPA_FIXES);

    s = s
        .replaceAll("...", ".")
        .replaceAll(" ..", ".");

    s = applyRules(s, remap);
    
    s = s
        // .replaceAll("ɑ.r", "ɑː")
        .replaceAll(".|.|", " || ")
        .replaceAll(".|", " | ")


    let result = `[${s}]`


    result = result
        .replaceAll(" || ]", "]")
        .replaceAll(" | ]", "]")
        .replaceAll(" ||  ", " || ")
        .replaceAll(" |  ", " | ")
        .replaceAll("(.", "(")
        .replaceAll(".)", ")")


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

function findMergeTarget(renderPipeline) {
    const i = renderPipeline.length - 1;
    if (i < 0) return null;

    const glyph = renderPipeline[i];

    if (!glyph || glyph.raw) return null;
    if (glyph.merged) return null;

    if (glyph.multi) {
        const lastPart = glyph.parts[glyph.parts.length - 1];
        if (!lastPart.merged) return { glyph, index: i };
        return null;
    }

    return { glyph, index: i };
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
 * @param {number} type 0 = normal; 1 = merged
 * @returns 
 */
function script(s, type = 0){
    const old_s = String(s);

    s = 
        s.replaceAll("ā", "ᨔᨎ")
        .replaceAll("c", "ᨎ")
        .replaceAll("ə", "ᨎ")
        .replaceAll("z", "ᨎ");

    const script_map = {
        p: { base: "ᨃ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        b: { base: "ᨃ", top: false, bottom: true,  left: false, right: false, special: false, vowel: false },
        t: { base: "ᨈ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        d: { base: "ᨊ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        "\uE008": { base: "ᨇ", top: false, bottom: false, left: false, right: false, special: false, vowel: false }, // gy/ky
        k: { base: "ᨍ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        g: { base: "ᨍ", top: false, bottom: true,  left: false, right: false, special: false, vowel: false },
        "\uE00B": { base: "ᨀ", top: false, bottom: false, left: false, right: false, special: false, vowel: false }, // glottal

        // top-bottom
        // "\uE003": { base: "ᨃ", top: true, bottom: true,  left: false, right: false, special: false, vowel: false }, // mb
        // "\uE004": { base: "ᨈ", top: true, bottom: true,  left: false, right: false, special: false, vowel: false }, // nd
        // "\uE005": { base: "ᨍ", top: true, bottom: true,  left: false, right: false, special: false, vowel: false }, // ngg

        // special
        // "\uE003": { base: "ᨃ", top: false, bottom: false,  left: false, right: false, special: true, vowel: false }, // mb
        // "\uE004": { base: "ᨈ", top: false, bottom: false,  left: false, right: false, special: true, vowel: false }, // nd
        // "\uE005": { base: "ᨍ", top: false, bottom: false,  left: false, right: false, special: true, vowel: false }, // ngg

        // og
        // "\uE003": { base: "ᨃ", top: false, bottom: false,  left: true, right: false, special: false, vowel: false }, // mb
        // "\uE004": { base: "ᨈ", top: false, bottom: false,  left: true, right: false, special: false, vowel: false }, // nd
        // "\uE005": { base: "ᨍ", top: false, bottom: false,  left: true, right: false, special: false, vowel: false }, // ngg

        // left + bottom
        // "\uE003": { base: "ᨃ", top: false, bottom: true,  left: true, right: false, special: false, vowel: false }, // mb
        // "\uE004": { base: "ᨈ", top: false, bottom: true,  left: true, right: false, special: false, vowel: false }, // nd
        // "\uE005": { base: "ᨍ", top: false, bottom: true,  left: true, right: false, special: false, vowel: false }, // ngg

        // super special
        "\uE003": { multi: true, parts: [
            { raw: true, base: "ᨌ" },
            { base: "ᨃ", top: false, bottom: false,  left: false, right: false, special: true, vowel: false }, // mb
        ] },
        "\uE004": { multi: true, parts: [
            { raw: true, base: "ᨌ" },
            { base: "ᨈ", top: false, bottom: false,  left: false, right: false, special: true, vowel: false }, // nd
        ] },
        "\uE005": { multi: true, parts: [
            { raw: true, base: "ᨌ" },
            { base: "ᨍ", top: false, bottom: false, left: false, right: false, special: true, vowel: false }, // ngg
        ] },

        m: { base: "ᨅ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        n: { base: "ᨄ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        "\uE006": { base: "ᨋ", top: false, bottom: false,  left: false, right: false, special: false, vowel: false }, // ng
        f: { base: "ᨂ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        v: { base: "ᨂ", top: false, bottom: true,  left: false, right: false, special: false, vowel: false },
        s: { base: "ᨆ", top: false, bottom: false, left: false, right: false, special: false, vowel: false },
        h: { base: "ᨀ", top: false, bottom: true, left: false, right: false, special: false, vowel: false },
        "\uE007": { base: "ᨉ", top: false, bottom: false, left: false, right: false, special: false, vowel: false }, // ts
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
        "\uE00A": { base: "ᨖ", top: false, bottom: true,  left: false, right: false, special: false, vowel: true  }, // är
        "\uE002": { multi: true, parts: [
            { base: "ᨅ", top: false, bottom: false, left: false, right: false, special: false, vowel: false }, // m
            { base: "ᨃ", top: false, bottom: true,  left: false, right: false, special: false, vowel: false } // b
        ] },
        "\uE001": { multi: true, parts: [
            { base: "ᨄ", top: false, bottom: false, left: false, right: false, special: false, vowel: false }, // n
            { base: "ᨊ", top: false, bottom: false, left: false, right: false, special: false, vowel: false } // d
        ] },

        // punctuation
        "(": { raw: true, base: "（" },
        ")": { raw: true, base: "）" },
    }


    const kepwamete_script_map = {
        "p": {
            base: "ᨃ",
            mod: false,
            top: false,
            bottom: false,
        },
        "b": {
            base: "ᨃ",
            mod: false,
            top: true,
            bottom: false,
        },
        "t": {
            base: "ᨈ",
            mod: false,
            top: false,
            bottom: false,
        },
        "d": {
            base: "ᨈ",
            mod: false,
            top: true,
            bottom: false,
        },
        "\uE008": { // gy/ky
            base: "ᨇ",
            mod: false,
            top: false,
            bottom: false,
        },
        "k": {
            base: "ᨍ",
            mod: false,
            top: false,
            bottom: false,
        },
        "g": {
            base: "ᨍ",
            mod: false,
            top: true,
            bottom: false,
        },
        "\uE00B": { // glottal
            base: "ᨔ",
            mod: false,
            top: false,
            bottom: false,
        },
        "\uE003": { // mb
            base: "ᨅ",
            mod: false,
            top: false,
            bottom: true,
        },
        "\uE004": { // nd
            base: "ᨄ",
            mod: false,
            top: false,
            bottom: true,
        },
        "\uE005": { // ngg
            base: "ᨋ",
            mod: false,
            top: false,
            bottom: true,
        },
        "m": {
            base: "ᨅ",
            mod: false,
            top: false,
            bottom: false,
        },
        "n": {
            base: "ᨄ",
            mod: false,
            top: false,
            bottom: false,
        },
        "\uE006": { // ng
            base: "ᨋ",
            mod: false,
            top: false,
            bottom: false,
        },
        "f": {
            base: "ᨂ",
            mod: false,
            top: false,
            bottom: false,
        },
        "v": {
            base: "ᨂ",
            mod: false,
            top: true,
            bottom: false,
        },
        "s": {
            base: "ᨆ",
            mod: false,
            top: false,
            bottom: false,
        },
        "h": {
            base: "ᨖ",
            mod: false,
            top: false,
            bottom: false,
        },
        "\uE007": { // ts
            multi: true,
            parts: [
                { base: "ᨈ", mod: false, top: false, bottom: false },
                { base: "ᨆ", mod: false, top: false, bottom: false },
            ],
        },
        "w": {
            base: "ᨏ",
            mod: false,
            top: false,
            bottom: false,
        },
        "y": {
            base: "ᨒ",
            mod: false,
            top: false,
            bottom: false,
        },
        "l": {
            base: "ᨓ",
            mod: false,
            top: false,
            bottom: false,
        },
        "i": {
            base: "ᨌ",
            mod: false,
            top: false,
            bottom: false,
        },
        "ü": {
            base: "ᨄ",
            mod: true,
            top: false,
            bottom: false,
        },
        "í": {
            base: "ᨌ",
            mod: false,
            top: false,
            bottom: true,
        },
        "u": {
            base: "ᨏ",
            mod: true,
            top: false,
            bottom: false,
        },
        "ú": {
            base: "ᨏ",
            mod: true,
            top: false,
            bottom: true,
        },
        "e": {
            base: "ᨑ",
            mod: false,
            top: false,
            bottom: false,
        },
        "é": {
            base: "ᨑ",
            mod: false,
            top: false,
            bottom: true,
        },
        "ë": {
            base: "ᨖ",
            mod: true,
            top: true,
            bottom: false,
        },
        "o": {
            base: "ᨉ",
            mod: false,
            top: false,
            bottom: false,
        },
        "ó": {
            base: "ᨉ",
            mod: false,
            top: false,
            bottom: true,
        },
        "a": {
            base: "ᨀ",
            mod: false,
            top: false,
            bottom: false,
        },
        "á": {
            base: "ᨀ",
            mod: false,
            top: false,
            bottom: true,
        },
        "ä": {
            base: "ᨔ",
            mod: true,
            top: false,
            bottom: false,
        },
        "\uE00A": { // är
            base: "ᨔ",
            mod: true,
            top: false,
            bottom: true,
        },
        "\uE002": { // mbb
            multi: true,
            parts: [
                { base: "ᨅ", mod: false, top: false, bottom: false },
                { base: "ᨃ", mod: true, top: false, bottom: false },
            ],
        },
        "\uE001": { // ndd
            multi: true,
            parts: [
                { base: "ᨄ", mod: false, top: false, bottom: false },
                { base: "ᨊ", mod: false, top: false, bottom: false },
            ],
        },


        // "p": "ᨃ",
        // "b": "ᨃᨙ",
        // "t": "ᨈ",
        // "d": "ᨈᨙ",
        // "\uE008": "ᨇ", // gy/ky
        // "k": "ᨍ",
        // "g": "ᨍᨙ",
        // "\uE00B": "ᨔ", // glottal
        // "\uE003": "ᨅᨘ", // mb
        // "\uE004": "ᨄᨘ", // nd
        // "\uE005": "ᨋᨘ", // ngg
        // "m": "ᨅ",
        // "n": "ᨄ",
        // "\uE006": "ᨋ", // ng
        // "f": "ᨂ",
        // "v": "ᨂᨙ",
        // "s": "ᨆ",
        // "h": "ᨖ",
        // "\uE007": "ᨈᨆ", // ts
        // "w": "ᨏ",
        // "y": "ᨑ",
        // "l": "ᨓ",
        // "i": "ᨑᨚ",
        // "ü": "ᨄᨚ",
        // "í": "ᨑᨚᨀ",
        // "u": "ᨏᨚ",
        // "ú": "ᨏᨚᨀ",
        // "e": "ᨇᨚ",
        // "é": "ᨇᨚᨀ",
        // "ë": "ᨖᨚ",
        // "o": "ᨆᨚ",
        // "ó": "ᨆᨚᨀ",
        // "a": "ᨍᨚ",
        // "á": "ᨍᨚᨀ",
        // "ä": "ᨔᨚ",
        // "\uE00A": "ᨔᨚᨀ", // är
        // "\uE002": "ᨅᨃ", // mb
        // "\uE001": "ᨄᨊ", // nd
    }

    const NEW_KEPWAMETE = true;

    const script_replace_list = {
        "mbb": "\uE002", // X
        "ndd": "\uE001", // Y
        "mb": "\uE003", // B
        "nd": "\uE004", // D
        "ngg": "\uE005", // G
        "ng": "\uE006", // N
        "ts": "\uE007", // S
        "gy": "\uE008", // C
        "ky": "\uE008", // C
        "är": "\uE00A", // Q
        "'": "\uE00B", // Z
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
        if(NEW_KEPWAMETE){

            let pipeline = [];

            for(let i = 0; i < s.length; i++){
                let char = s[i];



                if(kepwamete_script_map[char] != undefined){
                    if(kepwamete_script_map[char].multi) pipeline.push(...kepwamete_script_map[char].parts);
                    else pipeline.push(kepwamete_script_map[char]);
                } else {

                    if(char == " ") {
                        pipeline.push({ raw: true, base: "\u2002" });
                        continue;
                    }

                    pipeline.push({ raw: true, base: char });
                }
            }

            for(let i = 0; i < pipeline.length; i++){
                let current = pipeline[i];
                let next = pipeline[i + 1];

                if(current.raw) {
                    rendered += renderGlyph({
                        base: current.base,
                        raw: true
                    })
                    continue;
                }

                const renderable = { 
                    base: current.base,
                    top: current.top,
                    bottom: current.bottom,
                    left: false,
                    right: false,
                    special: false,
                    raw: current.raw
                }


                if(current.mod){
                    if(next?.base == current.base){
                        renderable.right = true;
                        renderable.left = false;
                    } else {
                        renderable.right = false;
                        renderable.left = true;
                    }
                }


                rendered += renderGlyph(renderable);
            }

            return rendered;
        }

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

        // Helper to deep copy glyphs
        const copy = (g) => g?.multi ? { ...g, parts: g.parts.map(p => ({ ...p })) } : { ...g };

        for (let i = 0; i < s.length; i++) {
            const char = s[i];
            const curr = script_map[char];

            // Handle first character or non-existent mapping
            if (i == 0 || !curr) {
                renderPipeline.push(curr ? copy(curr) : { raw: true, base: char });
                continue;
            }

            if (curr.merged == undefined) curr.merged = false;

            // Push if previous is raw, multi, or special cases
            if (renderPipeline[renderPipeline.length - 1]?.raw || curr.multi || curr.special || 
                curr.base == "ᨑ" || curr.base == "ᨌ" ) {
                renderPipeline.push(curr.multi ? copy(curr) : { ...curr });
                continue;
            }

            // Try to merge vowels with diacritics
            const currHasDiacritics = curr.top || curr.bottom || curr.left || curr.right || curr.special;

            if (curr.vowel && currHasDiacritics) {
                const target = findMergeTarget(renderPipeline);

                if (!target || target.glyph.merged) {
                    renderPipeline.push({ ...curr });
                    continue;
                }

                // if(curr.vowel && target.glyph.vowel){
                //     renderPipeline.push({ ...curr });
                //     continue;
                // }


                const { glyph: prev, index } = target;
                const slotBlocked = (curr.top && prev.top) || (curr.bottom && prev.bottom) ||
                                    (curr.left && prev.left) || (curr.right && prev.right) ||
                                    (curr.special && prev.special);

                if (!slotBlocked) {
                    if (prev.multi) {
                        const lastIdx = prev.parts.length - 1;
                        const lastPart = prev.parts[lastIdx];
                        prev.parts[lastIdx] = {
                            ...lastPart,
                            top: lastPart.top || curr.top,
                            bottom: lastPart.bottom || curr.bottom,
                            left: lastPart.left || curr.left,
                            right: lastPart.right || curr.right,
                            special: lastPart.special || curr.special,
                            vowel: false,
                            merged: true,
                        };
                    } else {
                        renderPipeline[index] = {
                            base: prev.base,
                            top: prev.top || curr.top,
                            bottom: prev.bottom || curr.bottom,
                            left: prev.left || curr.left,
                            right: prev.right || curr.right,
                            special: prev.special || curr.special,
                            vowel: false,
                            merged: true,
                        };
                    }

                    if (curr.base.startsWith("ᨖ")) {
                        renderPipeline.push({ raw: true, base: "ᨑ" });
                    }
                    continue;
                }
            }

            renderPipeline.push({ ...curr });
        }

        rendered = renderPipeline.map(renderGlyph).join("");
    }


    rendered = rendered.replace(/([^ ])ᨌ/g, "$1");
    rendered = rendered.replace(/ /g, "\u2002"); // en space
    return rendered.replace(/ ᨟$/g, "")
}

export class ConlangContent {
    static toStringInfo = true;
    constructor(s) {
        s = s.trim().normalize("NFC").split("\n");

        this.ipa = s.map(ipa).map(line => line.replaceAll("[]", ""));
        this.ortho = s.map(ortho)
        this.script_low = s.map(line => script(ortho(line), 0));
        this.script_high = s.map(line => script(ortho(line), 1));
    }

    /**
     * 
     * @param {Number} scriptType - 0 = separate, 1 = condensed
     * @param {Boolean} prettyOutput - if true, each entry is grouped together with a blank line between entries
     * @param {String[]} includedCategories  - categories to include: "ortho", "script", "ipa"
     * @returns 
     */
    toString(scriptType = 0, prettyOutput = false, includedCategories = ["ortho", "script", "ipa"]) {
        if(ConlangContent.toStringInfo) console.info(`ConlangContent.toString scriptType<Number>, prettyOutput<Boolean>, includedCategories<String[]>. If scriptType is "low" it will use "0", if "high" it will use "1". Default includedCategories are all three.`);
        let lines = [];

        if(scriptType == "low") scriptType = 0;
        if(scriptType == "high") scriptType = 1;

        // Helper to check if a category is included
        const include = (cat) => includedCategories.includes(cat);

        if (prettyOutput) {
            for (let i = 0; i < this.ipa.length; i++) {
                if (include("ortho")) lines.push(this.ortho[i]);
                if (include("script")) lines.push(scriptType === 0 ? this.script_low[i] : this.script_high[i]);
                if (include("ipa")) lines.push(this.ipa[i].replaceAll("[]", ""));
                lines.push(""); // Add a blank line between entries
            }
        } else {
            if (include("ortho")) lines.push(this.ortho.join("\n"));
            if (include("script")) lines.push((scriptType === 0 ? this.script_low : this.script_high).join("\n"));
            if (include("ipa")) lines.push(this.ipa.map(line => line.replaceAll("[]", "")).join("\n"));
        }

        const result = lines.join("\n").trim();

        if(result == "") return null;
        return result;
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
        this.script = {};
        this.category = undefined;

        if(Word.dialects == undefined){
            console.warn("Dialects not set. Defaulting to \"Standard\" dialect.")
            Word.dialects = ["Standard"];
        }

        if(arguments.length - 1 < Word.dialects.length){
            this.value[Word.dialects[0]] = value;
            this.script[Word.dialects[0]] = new ConlangContent(value);
        } else {
            for(let i = 1; i < arguments.length; i++){
                this.value[Word.dialects[i-1]] = arguments[i];
                this.script[Word.dialects[i-1]] = new ConlangContent(arguments[i]);
            }
        }

        // for each dialect that isnt the standard one
        Word.dialects.forEach(dialect => {
            if((this.value[dialect] == undefined)) this.value[dialect] = this.value["Standard"];
            if((this.script[dialect] == undefined)) this.script[dialect] = new ConlangContent(this.value[dialect]);
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