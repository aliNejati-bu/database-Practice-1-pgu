

function f() {
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            resolve("salam");
        },5000);
    });
}



async function f2(){
    let result = await f();
    console.log(result)
}

f2();