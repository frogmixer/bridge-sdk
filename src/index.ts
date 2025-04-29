/**
 * How frogmixer bridge works  ?
 * 
 * 1. Select 2 target chain 
 * 2. Input amount 
 * 3. Send to ff.io
 **/
import * as nacl from "tweetnacl"
import bs58 from "bs58"
import { createHmac } from 'crypto';
import { XMLParser } from 'fast-xml-parser';

export class bridge {
  router = {
    baseUrl :"https://ff.io",
    route : {
      price :"/rates/fixed.xml",
      bridge:"/api/v2/create"
    }
  }

  price:any;
  config:any;

  constructor(config = {
    keys:[]
  }) {
    this.config = config;
  }
  private get = async(url:string)=>
  {
    const requestOptions = {
      method: "GET",
      redirect: "follow"
    };
    const response = await fetch(url, requestOptions as any);
    return response.text();
  }

  private post = async(url:string,body?:any,header?:any)=>
    {
      const requestOptions = {
        method: "GET",
        redirect: "follow"
      };
      const response = await fetch(url, requestOptions as any);
      return response.text();
    }
  private ran_key = () =>
  {
    const array = this.config.keys;
    const len = array.length;
    if (len === 0) {
      return undefined;
    }
    const idx = Math.floor(Math.random() * len);
    return array[idx];
  }
  public init = async()=>
  {
    try{
      //Price init
      const xml = await this.get(this.router.baseUrl + this.router.route.price)
      const parser = new XMLParser({
        ignoreAttributes:  false,
        attributeNamePrefix:  '@_',
      });
      const price =await parser.parse(xml);
      this.price = price.rates.item;
      return true;
    }catch(e)
    {
      return false;
    }
  }

  public sign = (
    data: any,
    secret: string
  )=>
  {
    let str: string;

    if (typeof data === 'object' && data !== null) {
      const parts = Object.entries(data)
        .map(([key, value]) => `${key}=${value}`);
      str = parts.join('&');
    } else {
      str = data;
    }
  
    return createHmac('sha256', secret)
      .update(str)
      .digest('hex');
  }
  public estimate =(config = {
    from:"",
    to:"",
    amount:0
  })=>
  {
    for(let i in this.price)
    {
      let e = this.price[i];
      if(e.from == config.from.toUpperCase() && e.to == config.to.toUpperCase())
        {
          return e?.tofee ? ((Number(config.amount)*e.out)-Number((e.tofee.split(e.to))[0])) : (Number(config.amount)*e.out)
        }
    }
    return 0;
  }

  public bridge =async (config = {
    from:"",
    to:"",
    amount:0,
    type:"float",
    refcode:"nsvhdzsa"
  })=>{
    try{
      const body = {
        type:config.type,
        fromCcy:config.from,
        toCcy:config.to,
        direction:"from",
        amount:config.amount,
        refcode:config.refcode
      }
      
      const k = this.ran_key()
      return await this.post(this.router.baseUrl+this.router.route.bridge,body,{
        "X-API-KEY":k,
        "X-API-SIGN":this.sign(body,k)
      })
    }catch(e)
    {
      return false;
    }
  }
}