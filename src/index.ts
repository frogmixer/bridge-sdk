/**
 * How frogmixer bridge works  ?
 * 
 * 1. Select 2 target chain 
 * 2. Input amount 
 * 3. Send to ff.io
 **/
import { createHmac } from 'crypto';
import { XMLParser } from 'fast-xml-parser';

interface BridgeConfig {
  from: string;
  to: string;
  amount: number;
  toAddress:string;
  type?: string;
  refcode?: string;
  afftax?:number
}

const SLEEP_INTERVAL = 10000
const MAX_LOOP_TIMES = 60
export class bridge {
  router = {
    baseUrl :"https://ff.io",
    route : {
      price :"/rates/fixed.xml",
      bridge:"/api/v2/create",
      order:"/api/v2/order",
    }
  }

  price:any;
  config:any;
  bridge_info:any;
  key:any[];

  constructor(config :any) {
    this.config = config;
    if(config?.baseUrl)
    {
      this.router.baseUrl = config.baseUrl
    }
    this.key = this.ran_key()
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

  private post = async(url:string,body?:any,headers?:any)=>
    {
      try{
        const requestOptions = {
          headers,
          method: "POST",
          redirect: "follow",
          body:JSON.stringify(body)
        };
        const response = await fetch(url, requestOptions as any);
        return response.json();
      }catch(e)
      {
        return false;
      }
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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

  sign(data: string,API_SECRET:string): string {
    return createHmac('sha256', API_SECRET)
      .update(data)
      .digest('hex');
  }
  public estimate =(config = {
    from:"",
    to:"",
    amount:0
  })=>
  {
    for(const i in this.price)
    {
      const e = this.price[i];
      if(e.from == config.from.toUpperCase() && e.to == config.to.toUpperCase())
        {
          return e;
          // return e?.tofee ? ((Number(config.amount)*e.out)-Number((e.tofee.split(e.to))[0])) : (Number(config.amount)*e.out)
        }
    }
    return 0;
  }


  public bridge =async (config:BridgeConfig)=>{
    const {
      from,
      to,
      amount,
      toAddress,
      type = "float",
      refcode = "9jffbqvc",
      afftax=0
    } = config;

    try{
      const body = {
        type:type,
        fromCcy:from,
        toCcy:to,
        toAddress,
        direction:"from",
        amount:amount,
        refcode:refcode,
        afftax
      }
      const k = this.key;
      const h = new Headers();
      h.append('Content-Type','application/json');
      h.append( "X-API-KEY",k[0]);
      h.append("X-API-SIGN",this.sign(JSON.stringify(body),k[1]));
      const b = await this.post(this.router.baseUrl+this.router.route.bridge,body,h)
      this.bridge_info = b;
      return b;
    }catch(e)
    {
      console.log(e)
      return false;
    }
  }

  public bridge_status = async (_id?:string,_token?:string) =>
  {
    const id = _id??(this.bridge_info?.data?this.bridge_info.data?.id:false);
    const token = _token??(this.bridge_info?.data?this.bridge_info.data?.token:false);
    if(!id || !token)
    {
      return false;
    }
    const body = {
      id,
      token
    }
    const k = this.key;
    const h = new Headers();
    h.append('Content-Type','application/json');
    h.append( "X-API-KEY",k[0]);
    h.append("X-API-SIGN",this.sign(JSON.stringify(body),k[1]));
    const b = await this.post(this.router.baseUrl+this.router.route.order,body,h)
    this.bridge_info = b;
    return b
  }

  public bridge_confirm = async (_id?:string,_token?:string) =>
    {
      let loopTime = 0;
      while(loopTime>-1)
      {
        if(this.bridge_info && this.bridge_info?.data && this.bridge_info.data.status == "DONE")
        {
          return this.bridge_info.data;
        }
        const id = _id??(this.bridge_info?.data?this.bridge_info.data?.id:false);
        const token = _token??(this.bridge_info?.data?this.bridge_info.data?.token:false);
        if(!id || !token)
          {
            return false;
          }
        await this.bridge_status(id,token)
        await this.sleep(SLEEP_INTERVAL)
        if(loopTime>=MAX_LOOP_TIMES)
        {
          return false;
        }
        loopTime++;
      }
    }
}