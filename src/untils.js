
import {readFile} from 'fs/promises'
import VDF from '@node-steam/vdf'

export async function getItemsGame(pathItemsGame){
    const stringItemsGame = await readFile(`${pathItemsGame}/scripts/items/items_game.txt`,'utf-8');
    return VDF.parse(stringItemsGame).items_game;
}
export async function getItemsGameCDN(pathItemsGame){
    const itemGameConfig = await readFile(`${pathItemsGame}/scripts/items/items_game_cdn.txt`,'utf-8')
    const preitemGameObject = itemGameConfig.split('\r\n');
    let item = {}
    for(let i in preitemGameObject){
        let postitemGameObject = preitemGameObject[i].split('=')
        item[postitemGameObject[0]] = postitemGameObject[1];
    }
    
    return item
}
export async function getLang(pathItemsGame,languageString){
    const stringItemsGame = await readFile(`${pathItemsGame}/resource/csgo_${languageString}.txt`,'utf16le');
    return VDF.parse(stringItemsGame).lang.Tokens;
}

export async function getWeapons(itemsGame,lang){
    let weapons = {};
    for (let i in itemsGame.items){
        if(itemsGame.items[i].prefab !== null && itemsGame.items[i].name.includes('weapon_')){
            if(itemsGame.items[i].name !== 'weapon_knife' && itemsGame.items[i].name !== 'weapon_knife_t'){
                let item_name = itemsGame.items[i].item_name || itemsGame.prefabs[itemsGame.items[i].prefab].item_name
                let displayName = 'undefined'
                if(typeof(item_name) !== 'undefined'){
                    displayName = item_name.replace('#','') 
                }
                // console.log(item_name)
                weapons[itemsGame.items[i].name] = {
                    id:i,
                    displayName:lang[displayName]
                }
            }
           
        }
    }
    return weapons;
}

export async function getRarities(itemsGame,lang){
    let rarity = {};
    for(let index in itemsGame.rarities){
        rarity[index]={
            name:index,
            id:itemsGame.rarities[index].value,
            hexColor: itemsGame.colors[itemsGame.rarities[index].color].hex_color,
            displayText: lang[itemsGame.rarities[index].loc_key_weapon],
        }
    }
    return rarity;
}
export async function getQuailities(itemsGame,lang){
    let quality = [];
    for(let index in itemsGame.qualities){
        quality.push({
            name:index,
            id: itemsGame.qualities[index].value,
            hexColor: itemsGame.qualities[index].hexColor,
            displayText: lang[index]
        })
    }
    return quality;
}

export async function getPaintKits(itemsGame,lang){
    let painted_kits = {}
    for(let id in itemsGame.paint_kits){
        let descriptionTag = itemsGame.paint_kits[id].description_tag;
        if(typeof(descriptionTag) !== 'undefined'){
            let displayName = lang[itemsGame.paint_kits[id].description_tag.replace('#','')];
            let paint_kit = {
                id,
                displayName,
            }
            painted_kits[itemsGame.paint_kits[id].name] = paint_kit;
        }
    }
    return painted_kits;
}


export async function getSkins(pathItemsGame,languageString){
    let skins=[]
    const itemsGame = await getItemsGame(pathItemsGame);
    const itemsGameCDN = await getItemsGameCDN(pathItemsGame)
    const lang = await getLang(pathItemsGame,languageString);
    const weapons = await getWeapons(itemsGame,lang)
    const qualities = await getQuailities(itemsGame,lang)
    const rarities = await getRarities(itemsGame,lang)
    const paint_kits = await getPaintKits(itemsGame,lang)
    for(let index in itemsGame.alternate_icons2.weapon_icons){
        let icon_path = itemsGame.alternate_icons2.weapon_icons[index].icon_path;
        if(icon_path.includes('_medium')){
            let itemTag = icon_path.replace('_medium','').replace('econ/default_generated/','')
            Object.entries(weapons).forEach(([weaponTag, value]) => 
            {
                if(itemTag.includes(weaponTag))
                {
                    let skinTag = itemTag.replace(`${weaponTag}_`,'');
                    if(typeof(paint_kits[skinTag]) === 'undefined'){
                        skinTag = itemTag.replace(`${weaponTag}_silencer_`,'');
                    }
                    let displayText = `${value.displayName} | ${paint_kits[skinTag].displayName}`;
                    let rarity = itemsGame.paint_kits_rarity[skinTag];
                    if(value.id > 499 && value.id < 530){
                        displayText = `${value.displayName} (★) | ${paint_kits[skinTag].displayName}`;
                        rarity = 'unusual'
                    }
                    skins.push({
                        itemTag,
                        itemTagv2:`[${skinTag}]${weaponTag}`,
                        image:itemsGameCDN[itemTag],
                        weaponTag,
                        weaponID:parseInt(value.id),
                        skinTag,
                        skinID: parseInt(paint_kits[skinTag].id),
                        displayText,
                        rarity,
                    })
                }
            });
        }
    }
    for(let index in itemsGame.items){
        if(itemsGame.items[index].prefab === 'weapon_case'){
            // console.log(itemsGame.items[index].name);
            let name = itemsGame.items[index].name;
            // console.log(name);
            let loot_list = itemsGame.client_loot_lists[itemsGame.items[index].name];
            for(let i in loot_list){
                if(typeof(itemsGame.client_loot_lists[i]) !=='undefined')
                {
                    let rarity = i.replace(`${name}_`,'')
                    Object.keys(skins).forEach(key => {
                        let value = skins[key];
                        // console.log(key)
                        let skinWithWeaponTag = value.skinWithWeaponTag;
                        if(itemsGame.client_loot_lists[i].hasOwnProperty(skinWithWeaponTag)){
                            // console.log(`${skinWithWeaponTag} => ${value.rarity} => ${rarity}`);
                            value.rarity = rarity
                        }
                    })
                }
            }
        }
    }
    Object.keys(weapons).forEach(key => {
        let weapon = weapons[key]
        if(weapon.id > 499 && weapon.id < 530){
            let itemTag = `${key}_default`
            skins.push({
                itemTag,
                itemTagv2:`[default]${key}`,
                image:itemsGameCDN[key],
                weaponTag:key,
                weaponID:parseInt(weapon.id),
                skinTag:'default',
                skinID: 0,
                displayText:`${weapon.displayName} (★)`,
                rarity: 'unusual'
            })
        }
    })

    skins.forEach(skin=>{
        let old_skin_rarity = skin.rarity;
        skin.rarity = rarities[old_skin_rarity]
    })

    return skins;
}