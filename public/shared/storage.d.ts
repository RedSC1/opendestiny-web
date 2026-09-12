/* oxlint-disable typescript/no-explicit-any -- persisted records intentionally accept versioned JSON payloads from several tools */
export type ToolId='tarot'|'bazi'|'ziwei'|'calendar'|'qishuo';
export interface SavedRecord {id:string;kind:'tarot'|'bazi'|'ziwei'|'case';charts?:Record<string,{snapshot:any;form?:SavedRecord['form']}>;birth?:any;settings?:Record<string,any>;title:string;createdAt:number;updatedAt?:number;snapshot:any;form?:Array<{name:string;type:string;value:string;checked:boolean}>;}
export type RecordInput=Omit<SavedRecord,'id'>&{id?:string};
export interface Preferences {featured:ToolId|'auto';motion:boolean;locale:'zh-CN'|'zh-TW';}
export type ArchivedCaseRecord=Omit<SavedRecord,'id'>&{index:number};
export interface CaseArchive {format:'redsc1-tools-cases';version:2;exportedAt:string;records:ArchivedCaseRecord[];}
export interface TarotArchive {format:'redsc1-tools-tarot-history';version:1;exportedAt:string;records:ArchivedCaseRecord[];}
export interface CaseImportPreview {total:number;newCount:number;duplicateCount:number;}
export interface CaseImportResult {added:number;duplicateCount:number;}
export const TOOL_IDS:ToolId[];
export function listRecords(kind?:string):SavedRecord[];
export function readRecord(id:string):SavedRecord|null;
export function saveRecord(record:RecordInput):SavedRecord;
export function deleteRecord(id:string):void;
export function clearRecords(kind:string):void;
export function getPreferences():Preferences;
export function setPreferences(patch:Partial<Preferences>):Preferences;
export function recordUsage(tool:ToolId,now?:number):void;
export function getFeatured(now?:number):ToolId;
export function chooseFeatured(p:Preferences,counts:Partial<Record<ToolId,number>>):ToolId;
export const CASE_ARCHIVE_FORMAT:'redsc1-tools-cases';
export const CASE_ARCHIVE_VERSION:2;
export const TAROT_ARCHIVE_FORMAT:'redsc1-tools-tarot-history';
export const TAROT_ARCHIVE_VERSION:1;
export function createCaseArchive():CaseArchive;
export function parseCaseArchive(input:unknown):Array<Omit<SavedRecord,'id'>>;
export function previewCaseImport(input:unknown):CaseImportPreview;
export function importCaseArchive(input:unknown):CaseImportResult;
export function createTarotArchive():TarotArchive;
export function parseTarotArchive(input:unknown):Array<Omit<SavedRecord,'id'>>;
export function previewTarotImport(input:unknown):CaseImportPreview;
export function importTarotArchive(input:unknown):CaseImportResult;
