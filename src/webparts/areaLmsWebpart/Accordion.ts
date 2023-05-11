import { SPList } from "./AreaLmsWebpartWebPart";

interface module{
    ModuleLink:string
    Title:string
    CompletionStatus:string
}

const AccordionSection = (ChapterLabel:string, Chaptercolor:string, modules:module[], moduleTotal: number, moduleCompletedCount:number) => {
    let completionPrecent = Math.round(moduleCompletedCount/moduleTotal*100);
    let completionPadding = "";
    let completionPosition = "";
    let completionSize = "";
    if(completionPrecent<9){
        completionPadding = "8px 6px";
        completionPosition = "-1";
        completionSize = "14";
    };
    if(completionPrecent>9 && completionPrecent<100){
        completionPadding = "10px 5px"
        completionPosition = "-1";
        completionSize = "12";
    };
    if(completionPrecent==100){
        completionPadding = "12px 5px"
        completionPosition = "-2";
        completionSize = "10";
    };
    let html = `<button class="accordion" style="display:inline;background-color:${Chaptercolor};"><div role="progressbar" aria-valuenow="` + completionPrecent + `" aria-valuemin="0" aria-valuemax="100" style="position:relative;top:`+ completionPosition +`px;font-size:`+ completionSize +`px;padding:` + completionPadding + `;display:inline;--value:` + completionPrecent + `;"></div> - ${ChapterLabel}</button>
            <div class="panel">
              <table>`
              modules.forEach(module => {
                html += `<tr>
                <td>${module.CompletionStatus}</td>
                <td><a style="text-decoration: none;" class="sp-css-color-CyanFont" href="${module.ModuleLink}" target="_blank">${module.Title}</a></td>
              </tr>`
              });
                html +=`</table>
          </div>`
          return html
};

interface IchapterGroup{
    ChapterName: string
    Color: string
    Modules:module[]
    ModuleTotal: number
    moduleCompletedCount: number
}
const chapterGrouper = (data:SPList) => {
    let groups: IchapterGroup[]=[];
    let lastgroup: string = "";
    let modifiedStatus: string ="";
    data.value.forEach(item => { 
        let groupName = item.ChapterID.Title;
        let chColor = item.ChapterID.ChapterColor;
        let currentGroup: IchapterGroup;
        if(groupName === lastgroup){
            currentGroup = groups[groups.length-1]
        }else{
            lastgroup = groupName;
            groups.push({
                ChapterName:groupName,
                Color:chColor,
                Modules:[],
                ModuleTotal:0,
                moduleCompletedCount: 0
            })
            currentGroup = groups[groups.length-1]
        }
        if(item.CompletionStatus === true){
            modifiedStatus = "<span style='font:12px bold arial, sans-serif; color:white; background-color:green;border-radius:40px; padding:3px 5px;' >&#x2713; </span>";
            currentGroup.moduleCompletedCount += item.CompletionStatus ? 1 :0;
        }else{
            modifiedStatus = "<span style='display:inline-block;padding:1px 5px 3px 5px;font:12px bold arial,sans-serif;color:grey;border-radius:40px;border: 1px solid grey;'>&#x2212;</span>";
        }
        currentGroup.ModuleTotal += 1;
        currentGroup.Modules.push({
            CompletionStatus: modifiedStatus,
            ModuleLink: item.ModuleID.ModuleLink,
            Title: item.ModuleID.Title
        })
    })
    return groups
}
export {chapterGrouper};
export default AccordionSection;