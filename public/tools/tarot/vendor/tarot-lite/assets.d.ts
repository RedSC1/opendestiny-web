export const CARD_FILES:Readonly<Record<number,string>>;
export const CARD_IMAGE_SIZES:Readonly<Record<'table'|'detail',Readonly<{width:number;height:number}>>>;
export function getCardImageURL(id:number, options?:{size?:'table'|'detail';baseURL?:string|URL}):string;
