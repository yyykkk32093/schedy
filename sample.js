

// const humanName = "name";
// const age = 11;

// const message = `私の名前は${humanName}です。年齢は${age}です。`;
// console.log(message);

function func(arg) {

    return arg;

}

console.log(func("func"));


const func = function(str){

    return str;
}

console.log(func("func"));

//アロー関数
const funcAllowOneRow = (arg) => arg;

const funcAllow = (arg) => {

return arg;

}

console.log(funcAllow("funcAllow"));

const funcAllowObject = (arg1,arg2) => ({hoge: arg1,fuga: num2});

//分割代入

const profile = {

    name : "Mike",
    age: 22

}

const prof = `私の名前は${profile.name}です。年齢は${profile.age}です。`;

const {name,age="default"} = profile;
const message = `私の名前は${humanName}です。年齢は${age}です。`;

const profileArray = ["Tike",31];

const [name0,age1] = profileArray;

//オブジェクトの省略

const nameOmi = "Jon";
const ageOmi = 32;

const profileOmi ={

    nameOmi,
    ageOmi
};

//スプレッド構文

//配列展開

const arraySpread = [1,2];

console.log(...arraySpread);

const sumFunc = (num1,num2)=> console.log(num1 + num2);

sumFunc(...arraySpread);

//まとめる
const arraySpreadSummry = [1,2,3,4,5];

//cには余った3,4,5の配列
const [a,b,...c] = arraySpreadSummry;

const arraySumTrg1 = [1,2,3];

const arraySumTrg2 = [1,2,3];
//結合
const arraySummry = [...arraySumTrg1,...arraySumTrg2];



const newArray =arraySummry.map((name)=>{

return name;

});

const filteredArray = newArray.filter((num)=>{

    return num % 2 === 1;
});

arraySummry.map((name,index)=>{

    console.log(name + index);
    
    });

// || 左側がtruthyの時に判定
const num = null;
const fee = num || "default";

// && 左側がfalsyの時に判定
const num2 = null;
const fee2 = num2 && "default";