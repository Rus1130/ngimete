import { Dictionary, Word } from "./lib.js";

let setNames = [
    "Consonant Sounds",
    "Vowel Sounds",
    "Connecting Letters",
    "Pronouns",
    "Tenses",
    "Grammar", 
    "Demonstratives",
    "Numerals",
    "Nouns",
    "Verbs",
    "Adjectives",
    "Abstracted Verbs",
    "Superabstracted Verbs",
    "Reflexive Verbs",
    "Irregular Plural Nouns",
    "Nouns about Bones, Limbs, Body Parts, and Death",
    "Miscellaneous",
    "Interrogatives",
    "Cannibals and Mutants",
    "Religious Terms",
    "Phrases",
    "Onomatopoeia"
];

const dict = new Dictionary(...setNames);

Word.setDialects(["Standard", "A'atsilwi"])

dict.addWord("Consonant Sounds", 
    new Word("p", "/p/"),
    new Word("b", "/b/"),
    new Word("t", "/t/"),
    new Word("d", "/d/"),
    new Word("gy or ky", "/c/"),
    new Word("k", "/k/"),
    new Word("g", "/ɡ/"),
    new Word("'", "/ʔ/"),
    new Word("mb", "/ᵐb/"),
    new Word("nd", "/ⁿd/"),
    new Word("ngg", "/ᵑɡ/"),
    new Word("m", "/m/"),
    new Word("n", "/n̪/"),
    new Word("ng", "/ŋ/"),
    new Word("f", "/f/"),
    new Word("v", "/v/"),
    new Word("s", "/s/"),
    new Word("h", "/h~x~χ/"),
    new Word("ts", "/t͡s/"),
    new Word("w", "/w/"),
    new Word("y", "/j/"),
    new Word("l", "/l/"),
    new Word("mbb", "/m.b/"),
    new Word("ndd", "/n.d/"),
)

dict.addWord("Vowel Sounds",
    new Word("i", "/i/"),
    new Word("ü", "/y~ʏ~ɤ~ʌ/"),
    new Word("í", "/iː/"),
    new Word("u", "/u/"),
    new Word("ú", "/uː/"),
    new Word("e", "/ɛ~e/"),
    new Word("é", "/ɛː~eː/"),
    new Word("ë", "/ə~ɘ̹/"),
    new Word("o", "/ɔ~o/"),
    new Word("ó", "/ɔː~oː/"),
    new Word("a", "/a/"),
    new Word("á", "/aː/"),
    new Word("ä", "/ɑ/"),
    new Word("är", "/ɑː/"),
)

dict.addWord("Connecting Letters",
    new Word("letter group V", "a, e, i, o, u, á, é, í, ó, ú, ä, ë, ü"),
    new Word("letter group C", "b, d, f, g, h, k, l, m, n, p, s, t, v, w, y, r"),
    new Word("letter group C1", "m, n, s, v, w, r"),
    new Word("letter group A", "b, d, f, h, k, l, t"),
    new Word("letter group D", "g, p, y"),
    new Word("letter group P", "o, i, u"),
    new Word("ā", "break between the letter <a> and group C, the <a> gets replaced with <ā>"),
    new Word("ə", "break between groups P, C and group C"),
    new Word("c", "break between group V and groups V, D"),
    new Word("z", "break between group V and groups C1, A"),
)

dict.addWord("Pronouns", 
    // non possessives
    new Word("first person singular pronoun",   "yë"),
    new Word("first person plural pronoun",     "vë"),
    new Word("second person singular pronoun",  "'a"),
    new Word("second person plural pronoun",    "'ama",  "nga"),
    new Word("third person singular pronoun",   "ite",   "iti"),
    new Word("third person plural pronoun",     "ikyi",  "ki"),

    // non possessives respectful
    new Word("first person respectful pronoun",            "hë"),
    new Word("second person singular respectful pronoun",  "ha"),
    new Word("second person plural respectful pronoun",    "he"),
    new Word("third person singular respectful pronoun",   "ngi"),
    new Word("third person plural respectful pronoun",     "hi"),

    // possessives
    new Word("first person singular possessive pronoun",   "yo"),
    new Word("first person plural possessive pronoun",     "vo"),
    new Word("second person singular possessive pronoun",  "'ao"),
    new Word("second person plural possessive pronoun",    "'ame",  "ngo"),
    new Word("third person singular possessive pronoun",   "ito"),
    new Word("third person plural possessive pronoun",     "igyo",  "yaki"),

    // possessives respectful
    new Word("first person possessive respectful pronoun",   "ho"),
    new Word("second person possessive respectful pronoun",  "hao"),
    new Word("third person possessive respectful pronoun",   "hó"),

    // anti-possessives
    new Word("first person singular anti-possessive pronoun",   "go"),
    new Word("first person plural anti-possessive pronoun",     "gevo"),
    new Word("second person singular anti-possessive pronoun",  "gao"),
    new Word("second person plural anti-possessive pronoun",    "game",  "gamo"),
    new Word("third person singular anti-possessive pronoun",   "geto",  "gito"),
    new Word("third person plural anti-possessive pronoun",     "gegyo", "gayaki"),

    // anti-possessives respectful
    new Word("first person anti-possessive respectful pronoun",   "geho"),
    new Word("second person anti-possessive respectful pronoun",  "gehao"),
    new Word("third person anti-possessive respectful pronoun",   "gehó"),

    // reflexives
    new Word("first person singular reflexive pronoun",   "mo"),
    new Word("first person plural reflexive pronoun",     "ve"),
    new Word("second person singular reflexive pronoun",  "na"),
    new Word("second person plural reflexive pronoun",    "nge"),
    new Word("third person singular reflexive pronoun",   "ni"),
    new Word("third person plural reflexive pronoun",     "si"),
)

dict.addWord("Tenses",
    // human
    new Word("human far past", "mana'a"),
    new Word("human near past", "mana"),
    new Word("human near future", "na"),
    new Word("human far future", "na'a"),
    new Word("human hesternal", "paye"),
    new Word("human hodiernal", "boye"),
    new Word("human gnomic", "ndoní"),

    // animal
    new Word("animal far past", "lana'a"),
    new Word("animal near past", "lana"),
    new Word("animal present", "lawana"),
    new Word("animal near future", "la"),
    new Word("animal far future", "la'a"),
    new Word("animal hesternal", "pale"),
    new Word("animal hodiernal", "bole"),
    new Word("animal gnomic", "ndolí"),

    // cannibal
    new Word("cannibal far past", "ngana'a"),
    new Word("cannibal near past", "ngana"),
    new Word("cannibal present", "ngawana"),
    new Word("cannibal near future", "nga"),
    new Word("cannibal far future", "nga'a"),
    new Word("cannibal hesternal", "panga"),
    new Word("cannibal hodiernal", "bonga"),
    new Word("cannibal gnomic", "ndongí"),

    // inanimate
    new Word("inanimate far past", "mano'o"),
    new Word("inanimate near past", "mano"),
    new Word("inanimate present", "mawana"),
    new Word("inanimate near future", "no"),
    new Word("inanimate far future", "no'o"),
    new Word("inanimate hesternal", "pamo"),
    new Word("inanimate hodiernal", "bomo"),
    new Word("inanimate gnomic", "ndomó"),
)

dict.addWord("Grammar",
    new Word("Dative Case", "ma_"),
    new Word("Lative Case", "bo_"),
    new Word("Ablative Case", "_pa"),
    new Word("Genitive Case", "o-"),
    new Word("Vocative Case", "í"),
    new Word("Locative Case", "_wa"),
    new Word("Negative Locative Case", "_ga"),
    new Word("Adessive Case", "_ko"),
    new Word("Instrumental Case", "-to"),
    new Word("Comitative Case", "kole_", "ndwa_"),
    new Word("Essive-Formal Case", "-kyene"),
    new Word("Essive-Modal Case", "-kita"),
    new Word("Negative", "ga="),
    new Word("Verbalizer", "-le"),
    new Word("Nominalizer", "-te"),
    new Word("Adjectivizer", "-ya"),
    new Word("Adverbializer", "wána_", "wá>NOUN<na"),
    new Word("Diminutive", "=(o)lili"),
    new Word("Augmentative", "=(a)lala"),
    new Word("Derivation", "='an"),
    new Word("Secondary Derivation", "='on"),
    new Word("Copula", "wa_"),
    new Word("Negative Copula", "ga_"),
    new Word("Plural", "_me"),
    new Word("Potential Mood", "kana_"),
    new Word("Irrealis Mood", "kansa_"),
    new Word("Imperfective Aspect", "_gya"),
    new Word("Question Marker", "ka"),
    new Word("Respectful Question Marker", "nen", "neng"),
    new Word("Respect Marker", "pá"),
    new Word("Causative", "mbo"),
    new Word("Terminative Verbal Coordinator", "to'a"),
    new Word("Momentane Verbal Coordinator", "só"),
    new Word("Simultaneous Verbal Coordinator", "fá"),
    new Word("Interruptative Verbal Coordinator", "nde" ),
    new Word("Sequential", "lo"),
)

dict.addWord("Demonstratives",
    // Proximals
    new Word("this (human)", "luna"),
    new Word("this (animal)", "nu'u"),
    new Word("this (cannibal)", "nunga"),
    new Word("this (direction)", "nata"),
    new Word("this (object)", "ilu"),
    new Word("this (reflexive)", "ilo"),
    new Word("this (place)", "lulu'i"),

    // Medials
    new Word("that (human)", "yona"),
    new Word("that (animal)", "yu'u"),
    new Word("that (cannibal)", "yonga"),
    new Word("that (direction)", "yata"),
    new Word("that (object)", "inu"),
    new Word("that (reflexive)", "ino"),
    new Word("that (place)", "lu'i"),

    // Distals
    new Word("that over there (human)", "hona"),
    new Word("that over there (animal)", "hu'u"),
    new Word("that over there (cannibal)", "honga"),
    new Word("that over there (direction)", "hata"),
    new Word("that over there (object)", "ano"),
    new Word("that over there (reflexive)", "ano"),
    new Word("that over there (place)", "nu'i"),
)

const test = false;

if (test) dict.bulkAddFromUrl(`/words.txt`, "\n", "\t", "/");
else dict.bulkAddFromUrl(`https://rus1130.github.io/ngimete/words.txt`, "\n", "\t", "/");

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

            // a-C = ā
            // P-C = ə
            // V-C1 = z
            // V-D = c
            // V-A = z
            // C-C = ə
            // V-V = c


            if(left == "a" && C.includes(right)) {
                s = s.substring(0, i) + "ā" + s.substring(i+1)
                continue
            }
            if(P.includes(left) && C.includes(right)) {
                s = s.substring(0, i) + "ə" + s.substring(i+1)
                continue
            }
            if(V.includes(left) && C1.includes(right)) {
                s = s.substring(0, i) + "z" + s.substring(i+1)
                continue
            }
            if(V.includes(left) && D.includes(right)) {
                s = s.substring(0, i) + "c" + s.substring(i+1)
                continue
            }
            if(V.includes(left) && A.includes(right)) {
                s = s.substring(0, i) + "z" + s.substring(i+1)
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

            // if(V.includes(left) && D.includes(right)) {
            //     s = s.substring(0, i) + "c" + s.substring(i+1)
            //     continue
            // }
            // if(P.includes(left) && C.includes(right)) {
            //     s = s.substring(0, i) + "ə" + s.substring(i+1)
            //     continue
            // }
            // if(C.includes(left) && C.includes(right)) {
            //     s = s.substring(0, i) + "ə" + s.substring(i+1)
            //     continue
            // }
            // if(V.includes(left) && V.includes(right)) {
            //     s = s.substring(0, i) + "c" + s.substring(i+1)
            //     continue
            // }
            // if(V.includes(left) && C1.includes(right)) {
            //     s = s.substring(0, i) + "z" + s.substring(i+1)
            //     continue
            // }
            // if(V.includes(left) && A.includes(right)) {
            //     s = s.substring(0, i) + "z" + s.substring(i+1)
            //     continue
            // }
        }
    }

    s = s.replaceAll("aā", "ā");
    return s;
}

dict.waitForDictLoad().then(() => {
    for(let i = 0; i < dict.practiceOrder.length; i++){
        let cat = dict.practiceOrder[i];
        dict.dict[cat].forEach(word => {
            for(let j = 0; j < Object.keys(word.value).length; j++){
                word.value[Object.keys(word.value)[j]] = ortho(word.value[Object.keys(word.value)[j]]).replaceAll("-", "")
            }
        })
    }
})

export { dict }