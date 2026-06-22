// Shared app state, lifted out of the baseline's global scope into a module
// singleton. Same shape and initial values as app.js. The App shell imports
// this and the engine mutates it exactly as the original imperative code did.
export const STEPS = [["profile","Profile you"],["discover","Opportunities"],["blueprint","Blueprint"],["forge","Forge builds"],["sentinel","Sentinel verifies"],["grow","Studio grows"],["dashboard","Your dashboard"]];
export const state = {answers:{},reached:{profile:true},screen:"profile",opps:[],chosen:null,users:240,mrr:0,pace:1.5,follow:{},followQs:[],focuses:[],followShown:false,radarVals:[0,0,0,0,0]};
