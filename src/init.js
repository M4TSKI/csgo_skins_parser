import { getItemsGame, getLang, getRarities, getSkins } from "./untils.js";
import {writeFile} from 'fs/promises'
import chalk from "chalk";

await writeFile(`./build/mskins_${process.argv[3]}.json`,JSON.stringify(await getSkins(process.argv[2],process.argv[3]),null,2)).then(()=>{
    console.log(chalk.bgMagenta.bold.white("Config generated in build folder"))
})
