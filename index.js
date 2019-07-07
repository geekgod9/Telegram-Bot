//Packages
const Telegraf = require('telegraf');
const db=require('./db');
const UrlRegex=require('url-regex');
const getTitleAtUrl = require('get-title-at-url');
const fetch = require('node-fetch');
const ent = require('ent');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const _= require('lodash');

const memoryStore={};
// Title Regex
const titleRegex=/<title>(.+?)<\/title>/gim ;
const sanitiseTitle=title=>title.replace(/[\n\r\t]+/gm,' ');

const categories=['Article & News', 'Download Links', 'Miscellaneous'];
//Basic Messages
const welcomemssg=`Welcome! I am Bot Send me links to be stored 
Type :   " /help"  Guide \n `  ;
const helpmssg=`For New Collection : new collection Collection_Name \n 
For Collection of Links(Catogorized) : generate preview \n
For Category_Wise Display :show Collection_Name \n `;
const bot = new Telegraf(process.env.BOT_TOKEN);


const article=["Article & News"];
const download=["Download Links"];
const misc=["Miscellaneous"];

//Specific Category Links

const articleCategory = async (UserId,specificCategory)=> {
  const {links}=await db.findOne({UserId},{category:specificCategory});
    const groupedlinks= _.groupBy(links, it =>it.category);
    const markdown=article.map(category => {
      const header=`\n ## ${specificCategory} \n`;
      const links=groupedlinks[specificCategory]? groupedlinks[specificCategory].map(link=>`-[${sanitiseTitle(link.title)}](${link.url})\n`).reduce((acc,val)=>acc+val,'') : '- No Links Exists \n';
      return `${header}${links}`
    }).reduce((acc,val)=>acc+val,'');
  
  return markdown;

;}

const downloadCategory = async (UserId,specificCategory)=> {
  const {links}=await db.findOne({UserId},{category:specificCategory});
    const groupedlinks= _.groupBy(links, it =>it.category);
    const markdown=download.map(category => {
      const header=`\n ## ${specificCategory} \n`;
      const links=groupedlinks[specificCategory]? groupedlinks[specificCategory].map(link=>`-[${sanitiseTitle(link.title)}](${link.url})\n`).reduce((acc,val)=>acc+val,'') : '- No Links Exists \n';
      return `${header}${links}`
    }).reduce((acc,val)=>acc+val,'');
  
  return markdown;

;}

const miscCategory = async (UserId,specificCategory)=> {
  const {links}=await db.findOne({UserId},{category:specificCategory});
    const groupedlinks= _.groupBy(links, it =>it.category);
    const markdown=misc.map(category => {
      const header=`\n ## ${specificCategory} \n`;
      const links=groupedlinks[specificCategory]? groupedlinks[specificCategory].map(link=>`-[${sanitiseTitle(link.title)}](${link.url})\n`).reduce((acc,val)=>acc+val,'') : '- No Links Exists \n';
      return `${header}${links}`
    }).reduce((acc,val)=>acc+val,'');
  
  return markdown;

;}

const generateMarkdown = async (UserId)=> {
  const {links}=await db.findOne({UserId});
    const groupedlinks= _.groupBy(links, it =>it.category);
    const markdown=categories.map(category => {
      const header=`\n ## ${category} \n`;
      const links=groupedlinks[category]? groupedlinks[category].map(link=>`-[${sanitiseTitle(link.title)}](${link.url})\n`).reduce((acc,val)=>acc+val,'') : '- No Links Exists \n';
      return `${header}${links}`
    }).reduce((acc,val)=>acc+val,'');
  
  return markdown;
};

// Basic Commands
bot.start((ctx) => ctx.reply(welcomemssg));
bot.help((ctx) => ctx.reply(helpmssg));

bot.hears(/new collection (.+)/, async (ctx) =>{
                                 const UserId=ctx.from.id;
                                 const collectionName = ctx.match[1];
                                    
  //Remove previous colletion
                                 await db.remove({UserId},{multi:true})
                                    //Insert Data       
                                 await db.insert({UserId,collectionName,links:[] });
                                 ctx.reply(`New Collection was Created Name:  ${collectionName}
Now Start Adding the Links in this collection`);
                                 console.log(ctx);
                                 }
           
         );

bot.hears(UrlRegex(), async (ctx) =>{
  //Get URLS FROM MESSAGE
  const urls=ctx.message.text.match(UrlRegex());
  const firstUrl=urls[0];
  const UserId=ctx.from.id;  
  //Fetch Title of Url
  const body= await fetch(firstUrl).then(r => r.text());
  const titleTag= body.match(titleRegex);
  const title=ent.decode(titleTag.pop().replace('<title>','').replace('</title>',''));
  memoryStore[UserId]={url:firstUrl,title,category:''};
  //Pushing into database
  // await db.update({UserId},{$push: {links:{url:firstUrl,title,category:''}}});
  console.log(title);
  ctx.reply(`Ready to Save : ${title}.
What is the Category`, Markup.keyboard(['Article & News', 'Download Links', 'Miscellaneous'])
    .oneTime()
    .resize()
    .extra()
  );
  
  //If Article is Pressed
  
bot.hears('Article & News', async (ctx) =>{
                                 const UserId=ctx.from.id;
 
          ctx.reply(`Saving Link As Article And News : ${memoryStore[UserId].title}`);
  await db.update({UserId},{$push: {links:{url:firstUrl,title,category:'Article & News'}}});
} 
         );
  bot.hears('Download Links', async (ctx) =>{
                                 const UserId=ctx.from.id;
 
          ctx.reply(`Saving Link As Download Links : ${memoryStore[UserId].title}`);
  await db.update({UserId},{$push: {links:{url:firstUrl,title,category:'Download Links'}}});
} 
         );
  
  bot.hears('Miscellaneous', async (ctx) =>{
                                 const UserId=ctx.from.id;
 
          ctx.reply(`Saving Link As Miscellaneous : ${memoryStore[UserId].title}`);
  await db.update({UserId},{$push: {links:{url:firstUrl,title,category:'Miscellaneous'}}});
} 
         );
  
  
  
  } );

bot.hears(/generate markdown/i,async (ctx)=> {
    const UserId=ctx.from.id;
    const markdown=await generateMarkdown(UserId);
   ctx.reply(markdown,Extra.markdown().webPreview(false));
    
  });

bot.hears(/generate preview/i,async (ctx)=> {
    const UserId=ctx.from.id;
    const markdown=await generateMarkdown(UserId);
   ctx.reply(markdown,Extra.markdown().webPreview(false));
    
  });
//Show Article
  bot.hears(/show articles & news/i ,async (ctx)=>{
  const specificCategory='Article & News';
  const UserId=ctx.from.id;
  const markdown=await articleCategory(UserId,specificCategory);
  ctx.reply(markdown,Extra.markdown().webPreview(false));
});


bot.hears(/show download links/i ,async (ctx)=>{
  const specificCategory='Download Links';
  const UserId=ctx.from.id;
  const markdown=await downloadCategory(UserId,specificCategory);
  ctx.reply(markdown,Extra.markdown().webPreview(false));
});

bot.hears(/show miscllaneous/i ,async (ctx)=>{
  const specificCategory='Miscellaneous';
  const UserId=ctx.from.id;
  const markdown=await miscCategory(UserId,specificCategory);
  ctx.reply(markdown,Extra.markdown().webPreview(false));
});

bot.launch() ;    