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

    static levenshtein(a, b) {
        const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);

        for (let j = 0; j <= b.length; j++) dp[0][j] = j;

        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
                );
            }
        }

        return dp[a.length][b.length];
    }


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
        
                other = other.map(x => x.trim());

                if(!(category == "Grammar" || category == "Tenses" || category == "Phrases")){
                    other = other.map(x => x.replaceAll(" ", "-"));
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
        searchTerm = searchTerm;

        let category = options?.category || undefined;
        let dialect = options?.dialect || undefined;
        let swap = options?.swap || false;
        let excludedCategories = options?.excludedCategories || [];
        let regexSearch = options?.regexSearch || false;

        if(this.ready != true){
            throw new Error("Dictionary not loaded yet. Please wait for the dictionary to load before searching.");
        }

        let results = [];

        const set = (chars, extra = []) => {
            const alts = [...extra, ...(chars ? [`[${chars}]`] : [])];
            return alts.length > 1 ? `(?:${alts.join("|")})` : alts[0];
        };

        const regexShorthand = {
            "VS": set("aeiouäëü"),
            "VL": set("áéíóú", ["är"]),

            "CU": set("ptkfsh", ["ky"]),
            "CV": set("bdmnvwyl'", ["gy"]),

            "C": set("ptdkbg'mnfvshwyl", ["gy", "ky"]),
            "V": set("aeiouáéíóúäëü", ["är"]),

            "PN": set("", ["ngg", "nd(?!d)", "mb(?!b)"]),
            "NF": set("mn", ["ngg", "ng", "nd(?!d)", "mb(?!b)"]),
            "N":  set("mn", ["ng(?!g)"]),
        };
        
        const expandedSearchTerm = searchTerm.replace(
            new RegExp(Object.keys(regexShorthand).join("|"), "g"),
            match => regexShorthand[match]
        );

        const regex = regexSearch
            ? new RegExp(expandedSearchTerm, "i")
            : null;

        console.log(regex)

        const categories = category ? [category] : this.practiceOrder;

        if (category && !this.dict[category]) {
            return new Error(`Category "${category}" does not exist in the dictionary.`);
        }

        for (const cat of categories) {
            this.dict[cat].forEach(word => {
                const values = swap
                    ? dialect == undefined
                        ? Object.values(word.value)
                        : [word.value[dialect]]
                    : [word.key];

                const matches = values.some(value =>
                    regex ? regex.test(value) : value.includes(searchTerm)
                );

                if (matches) {
                    const word_ = new Word(word.key, ...Object.values(word.value));
                    word_.category = cat;
                    results.push(word_);
                }
            });
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


        results.sort((a, b) =>
            Dictionary.levenshtein(searchTerm, a.key) -
            Dictionary.levenshtein(searchTerm, b.key)
        );

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
    for (const [from, to] of Object.entries(rules)) {
        str = str.replaceAll(from, to);
    }
    return str;
}

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

const mods = {
    left: "ᨙ",
    top: "ᨗ",
    bottom: "ᨘ",
    right: "ᨚ",
    special: "ᨛ",
}

// every glyph starts from these flags; script_map entries only list what differs
const GLYPH_DEFAULTS = { top: false, bottom: false, left: false, right: false, special: false, vowel: false };

// vowel glyph helper: always vowel: true
const vowel = (base, extra) => ({ base, vowel: true, ...extra });


export class ngimeteContent {
    static non_syllabic_diacritic = "̯";

        // orthography -> internal single-character symbols (applied in order)
    static preMap = {
        "mbb": "M", // m.b
        "ndd": "N", // n.d
        "ky": "C",
        "gy": "J",
        "ts": "S", // t͡s
        "y": "j",
        "?": ".",
        "!": ".",

        "nd": "D", // ⁿd
        "mb": "B", // ᵐb
        "ngg": "G", // ᵑg
        "ng": "ŋ",
        "M": "mb",
        "N": "nd",

        "'": "ʔ",

        "á": "A", // aː
        "é": "E", // eː
        "í": "I", // iː
        "ó": "O", // oː
        "ú": "U", // uː
        "ä": "ɑ",
        "ë": "ə",
        "ü": "y",

        "..": ".",
    };

    static postMap = {
        "A": "aː",
        "E": "eː",
        "I": "iː",
        "O": "oː",
        "U": "uː",
        "Q": "ɑː",
        "C": "c",
        "J": "ɟ",
        "B": "ᵐb",
        "D": "ⁿd",
        "G": "ᵑɡ",
        "S": "t͡s",
        "M": "mb",
        "N": "nd",
        "..": "",
    };

    static script_replace_list = {
        "mbb": "\uE002",
        "ndd": "\uE001",
        "mb": "\uE003",
        "nd": "\uE004",
        "ngg": "\uE005",
        "ng": "\uE006",
        "ts": "\uE007",
        "ky": "\uE008",
        "gy": "\uE009",
        "är": "\uE00A",
        "'": "\uE00B",
        ",": " ᨞",
        ".": " ᨟",
        "?": " ᨟",
        "!": " ᨟",
    };

    static script_map = {
        // consonants
        p: { base: "ᨃ" },
        b: { base: "ᨃ", bottom: true },
        t: { base: "ᨈ" },
        d: { base: "ᨈ", bottom: true },
        k: { base: "ᨍ" },
        g: { base: "ᨍ", bottom: true },
        m: { base: "ᨅ" },
        n: { base: "ᨄ" },
        f: { base: "ᨂ" },
        v: { base: "ᨂ", bottom: true },
        s: { base: "ᨆ" },
        h: { base: "ᨀ", bottom: true },
        w: { base: "ᨏ" },
        y: { base: "ᨒ" },
        l: { base: "ᨓ" },

        // placeholder symbols (see script_replace_list)
        "\uE008": { base: "ᨇ" }, // ky
        "\uE009": { base: "ᨇ", bottom: true }, // gy
        "\uE00B": { base: "ᨀ" }, // h
        "\uE006": { base: "ᨋ" }, // ng
        "\uE007": { base: "ᨉ" }, // ts

        // prenasalized
        "\uE003": { multi: true, parts: [{ raw: true, base: "ᨌ" }, { base: "ᨃ", special: true }] }, // mb
        "\uE004": { multi: true, parts: [{ raw: true, base: "ᨌ" }, { base: "ᨈ", special: true }] }, // nd
        "\uE005": { multi: true, parts: [{ raw: true, base: "ᨌ" }, { base: "ᨍ", special: true }] }, // ngg

        // geminate clusters
        "\uE002": { multi: true, parts: [{ base: "ᨅ" }, { base: "ᨃ", bottom: true }] }, // m.b
        "\uE001": { multi: true, parts: [{ base: "ᨄ" }, { base: "ᨊ" }] },               // n.d

        // vowels
        a: vowel("ᨔ"),
        e: vowel("ᨔ", { left: true }),
        i: vowel("ᨔ", { top: true }),
        o: vowel("ᨔ", { right: true }),
        u: vowel("ᨔ", { top: true, right: true }),
        ä: vowel("ᨔ", { bottom: true }),
        ë: vowel("ᨔ", { special: true }),
        ü: vowel("ᨔ", { top: true, special: true }),
        á: vowel("ᨖ"),
        é: vowel("ᨖ", { left: true }),
        í: vowel("ᨖ", { top: true }),
        ó: vowel("ᨖ", { right: true }),
        ú: vowel("ᨖ", { top: true, right: true }),
        "\uE00A": vowel("ᨖ", { bottom: true, special: true }), // är

        // punctuation
        "(": { raw: true, base: "（" },
        ")": { raw: true, base: "）" },
    };

    static diphthongs = [
        "ao",
        "eo",
        "oa",
        "ie",
        "ae",
        "ua",
        "ai",
        "ia"
    ]

    // private-use placeholder characters standing in for each diphthong (index-aligned)
    static diphthongChars = ngimeteContent.diphthongs.map((_, i) => String.fromCodePoint(0xE000 + i));

    static groups = {
        "V": "aeiouɑəyAEIOUQ",  
        "C": "bdfghklmnpstvwjCJŋʔSBDG",
        "N": "mnŋ",
        "Z": "pbfvshtS",
        "T": "Ss",
        "J": "mnŋs",
        "W": ngimeteContent.diphthongChars.join(""),
    };

    static validSyllableShapes = {
        I: [
            "V",
            "CV",
            "ZwV",
        ],
        II: [
            "W",
            "CW",
            "ZwW",
        ],
        III: [
            "CVJ",
            "ZwVJ",
        ],
        IV: [
            "CWJ",
            "ZwWJ",
        ]
    }

    static syllables = [
        `kid`, // special case for "kid"
        "ZwV", // (p/b/f/v/s/h/ts)w(vowel)
        `TVl(?![${ngimeteContent.groups.V}])`, // (s/ts)-vowel-l not followed by vowel
        `CVN(?![${ngimeteContent.groups.V}])`, // consonant-vowel-nasal not followed by vowel
        `CVN(?=[${ngimeteContent.groups.C}])`, // consonant-vowel-nasal followed by consonant
        `CVs(?![${ngimeteContent.groups.V}])`, // consonant-vowel-s not followed by vowel
        `VN(?=[${ngimeteContent.groups.C}])`, // vowel-nasal followed by consonant
        "CV",
        "V",    
    ];

    // every valid syllable for each type, written out as IPA
    static allValidSyllables = Object.fromEntries(
        Object.entries(ngimeteContent.validSyllableShapes).map(([type, shapes]) => {
            const expand = (shape) => [...shape].reduce(
                (acc, ch) => acc.flatMap(prefix =>
                    [...(ngimeteContent.groups[ch] ?? ch)].map(c => prefix + c)
                ),
                [""]
            );

            return [type, shapes.flatMap(expand).map(syllable => {
                syllable = syllable.replace(
                    /[\uE000-\uF8FF]/g,
                    char => ngimeteContent.diphthongs[char.codePointAt(0) - 0xE000] ?? char
                );
                return applyRules(syllable, ngimeteContent.postMap);
            })];
        })
    );

    constructor(){
        throw new Error("This class is not meant to me created.")
    }
}

const IPA_FIXES = {
    "n": "n̪",
    "g": "ɡ",
    // "a.o" -> "ao̯"
    ...Object.fromEntries(
        ngimeteContent.diphthongs.map(d => [
            d[0] + "." + d[1],
            d + ngimeteContent.non_syllabic_diacritic
        ])
    ),
};

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

    s = s.replaceAll("-", "");
    s = s.replaceAll("=", "");

    s = s.replaceAll(".", "||");
    s = s.replaceAll(",", "|");

    s = s.replaceAll("z", ".");
    s = s.replaceAll("c", ".");
    s = s.replaceAll("ə", ".");
    s = s.replaceAll("ā", "a.");

    s = s.replaceAll("är", "Q");

    s = s.replaceAll('"', "");

    s = applyRules(s, ngimeteContent.preMap);

    s = s
        .split(" ")
        .map(s => syllabifyWord(s, ngimeteContent.groups, ngimeteContent.syllables))
        .join(" ");


    s = applyRules(s, IPA_FIXES);

    s = s
        .replaceAll("...", ".")
        .replaceAll(" ..", ".");

    s = applyRules(s, ngimeteContent.postMap);
    
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

function script(s){
    s = s.replaceAll("ā", "ᨔᨎ")
        .replaceAll("c", "ᨎ")
        .replaceAll("ə", "ᨎ")
        .replaceAll("z", "ᨎ");

    s = applyRules(s, ngimeteContent.script_replace_list);

    const VOWEL_AA = "ᨖ"
    const VOWEL_LONG_MARKER = "ᨑ"

    const prerenderPipeline = [];

    for(const ch of s){
        const entry = ngimeteContent.script_map[ch];
        if(entry == undefined){
            prerenderPipeline.push({ raw: true, base: ch });
        } else if(entry.multi){
            prerenderPipeline.push(...entry.parts.map(part => ({ ...GLYPH_DEFAULTS, ...part })));
        } else {
            prerenderPipeline.push({ ...GLYPH_DEFAULTS, ...entry });
        }
    }


    const renderPipeline = [];

    for(let i = 0; i < prerenderPipeline.length; i++){
        const curr = prerenderPipeline[i];
        const prev = renderPipeline[renderPipeline.length - 1];

        if(curr.raw){
            renderPipeline.push(curr);
            continue;
        }

        const hasAnySlot = curr.top || curr.bottom || curr.left || curr.right;

        if(curr.vowel && hasAnySlot && prev && !prev.raw && !prev.merged && !curr.special){

            const slotBlocked = (curr.top && prev.top) || (curr.bottom && prev.bottom) ||
                                (curr.left && prev.left) || (curr.right && prev.right);


            if(!slotBlocked){
                prev.top = prev.top || curr.top;
                prev.bottom = prev.bottom || curr.bottom;
                prev.left = prev.left || curr.left;
                prev.right = prev.right || curr.right;
                prev.merged = true;

                if(curr.base === VOWEL_AA){
                    renderPipeline.push({
                        raw: true,
                        base: VOWEL_LONG_MARKER
                    })
                }
            } else {
                renderPipeline.push(curr);
            }
        } else {
            renderPipeline.push(curr);
        }
    }

    const ALLOW_REPEATED_CONSONANT_MERGE = true;

    if(ALLOW_REPEATED_CONSONANT_MERGE) for(let i = 0; i < renderPipeline.length - 1; i++){
        let curr = renderPipeline[i];
        let next = renderPipeline[i + 1];

        if(
            next.base == curr.base && 
            curr.special == false  && 
            next.special == false  &&
            curr.vowel == false    && 
            next.vowel == false
        ){
            if(next.top || next.left || next.right || next.bottom || next.special) continue;

            curr.special = true;

            renderPipeline.splice(i + 1, 1);
            i--;
        }
    }

    let rendered = renderPipeline.map(renderGlyph).join("");

    let inQuotes = false;
    rendered.split("").forEach((char, index) => {
        if(char === "\""){
            rendered = rendered.substring(0, index) + (inQuotes ? " »" : "« ") + rendered.substring(index + 1);
            inQuotes = !inQuotes;
        }
    })


    rendered = rendered.replaceAll('"', "")
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
        this.script = s.map(line => script(ortho(line)));
    }

    /**
     * @param {Boolean} prettyOutput - if true, each entry is grouped together with a blank line between entries
     * @param {String[]} includedCategories  - categories to include: "ortho", "script", "ipa"
     * @returns 
     */
    toString(prettyOutput = false, includedCategories = ["ortho", "script", "ipa"]) {
        if(ConlangContent.toStringInfo) console.info(`ConlangContent.toString prettyOutput<Boolean>, includedCategories<String[]>. Default includedCategories are all three.`);
        let lines = [];

        // Helper to check if a category is included
        const include = (cat) => includedCategories.includes(cat);

        if (prettyOutput) {
            for (let i = 0; i < this.ipa.length; i++) {
                if (include("ortho")) lines.push(this.ortho[i]);
                if (include("script")) lines.push(this.script[i]);
                if (include("ipa")) lines.push(this.ipa[i].replaceAll("[]", ""));
                lines.push(""); // Add a blank line between entries
            }
        } else {
            if (include("ortho")) lines.push(this.ortho.join("\n"));
            if (include("script")) lines.push(this.script.join("\n"));
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

    script(){
        return script(this.ortho())
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
            this.value[Word.dialects[0]] = ortho(value);
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