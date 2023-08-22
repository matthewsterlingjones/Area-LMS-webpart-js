import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';
import { escape } from '@microsoft/sp-lodash-subset';

import styles from './AreaLmsWebpartWebPart.module.scss';
import * as strings from 'AreaLmsWebpartWebPartStrings';

export interface IAreaLmsWebpartWebPartProps {
  description: string;
  title: string;
}
//*** Variables & methods for getting and storing SharePoint List Data ***/
import {
  SPHttpClient,
  SPHttpClientResponse
} from '@microsoft/sp-http';
import AccordionSection, { chapterGrouper } from './Accordion';

export interface SPList {
  value: SPListItem[];
}
export interface SPListItem {
  ChapterID: { Title: string,ChapterColor:string };
  CompletionStatus: boolean;
  ModuleID: { ModuleLink: string, Title: string };
  ModuleLink: { URL: string, Description: string };
  StudentID: { FirstName: string, LastName: string };
}
export interface currentUserSelected {
  Title: { Title: string };
  Id: { Id: string };
  UserPrincipalName: { UserPrincipalName: string };
  Email: { Email: string };
}
export default class AreaLmsWebpartWebPart extends BaseClientSideWebPart<IAreaLmsWebpartWebPartProps> {
  // private _isDarkTheme: boolean = false;
  // private _environmentMessage: string = 'Development';

  //******-- Get current user --*******/
  private async _getCurrentUser(): Promise<currentUserSelected> {
    const queryUrl = `${this.context.pageContext.site.absoluteUrl}/_api/web/currentuser`;
    const CurrentUserData = await this.context.spHttpClient.get(queryUrl, SPHttpClient.configurations.v1);
    const CurrentUser = (CurrentUserData.json());
    return CurrentUser;
  }

  //************* Get List Data ********************/
  private _getListData(userId: string): Promise<SPList> {
    return this.context.spHttpClient.get(
      this.context.pageContext.web.absoluteUrl + 
      "/_api/web/lists/GetByTitle('StudentRecords')/Items?$select=StudentID/ID,StudentID/Title,StudentID/FirstName,StudentID/LastName,ModuleLink,CompletionStatus,ChapterID/Title,ChapterID/ChapterColor,ModuleID/Title,ModuleID/ModuleLink,ModuleID/OrderID&$filter=StudentID/ID eq '" + userId + "'&$expand=ChapterID,ModuleID,StudentID&$orderby=ChapterID/Title%20asc,ModuleID/OrderID%20asc",
      SPHttpClient.configurations.v1).then((response: SPHttpClientResponse) => {
        return response.json();
      });
  }

  /********* Render list data ****************/
  private _renderList(): void {
    this._getCurrentUser().then((response) => {
      let userId = response.Id;
      let userIdstr = userId.toString()
      let username = response.Title
      this._getListData(userIdstr).then((response) => {
        let html: string = '<style>#O365_NavHeader {display:none;} #sp_appBar{display:none;}.svg_dd790ee3{ width: 20px; height: 20px;} .accordion {border-radius:15px; font-size:18px; font-weight:bold; color: white;cursor: pointer; padding: 10px;width: 100%;text-align: left;margin:2px;border: none;outline: none;transition: 0.4s;}.active, .accordion:after {content: \"\\002B\";color: white;font-weight: bold;float: right;margin-left: 5px;}.active:after {content: \"\\2212\";} .panel {padding: 0 18px;background-color: white;max-height:0;overflow: hidden;transition: max-height 0.2s ease-out;text-align:left;} @keyframes growProgressBar {0%, 33% { --pgPercentage: 0; }100% { --pgPercentage: var(--value);}} @property --pgPercentage {syntax: "<number>";inherits: false;initial-value: 0;} div[role="progressbar"] {--size: 10rem;--fg: #369;--bg: #def;--pgPercentage: var(--value);animation: growProgressBar 3s 1 forwards;width: var(--size);height: var(--size);border-radius: 50%;display: grid;place-items: center;background: radial-gradient(closest-side, white 80%, transparent 0 99.9%, white 0),  conic-gradient(var(--fg) calc(var(--pgPercentage) * 1%), var(--bg) 0)  ;font-family: Helvetica, Arial, sans-serif;font-size: calc(var(--size) / 10);color: var(--fg); } div[role="progressbar"]::before {counter-reset: percentage var(--value);content: counter(percentage) "%";}body {margin: 0;align-items: center;justify-content: center;height: 100vh;}</style><div style="position: absolute; right:10px;"><svg onclick="window.location.reload()" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" class="svg_dd790ee3" focusable="false"><path d="M1297 38q166 45 304 140t237 226 155 289 55 331q0 141-36 272t-103 245-160 207-208 160-245 103-272 37q-141 0-272-36t-245-103-207-160-160-208-103-244-37-273q0-140 37-272t105-248 167-212 221-164H256V0h512v512H640V215q-117 56-211 140T267 545 164 773t-36 251q0 123 32 237t90 214 141 182 181 140 214 91 238 32q123 0 237-32t214-90 182-141 140-181 91-214 32-238q0-150-48-289t-136-253-207-197-266-124l34-123z"></path></svg></div><div style="margin-bottom:5px;font:bold 20px Segoe, sans-serif">'+this.properties.title+'  ' + username + '</div><hr><div>'+this.properties.description+'</div>';
        html += '<div>';
        let Chapters = chapterGrouper(response);
        Chapters.forEach(chapter => {
          html+= AccordionSection(chapter.ChapterName,chapter.Color,chapter.Modules,chapter.ModuleTotal,chapter.moduleCompletedCount);
        });
        
        html += '</div>'
        const listContainer: Element = this.domElement.querySelector('#spListContainer');
        listContainer.innerHTML = html;
        /**** DOM manipulation to create accordion affect ********/
        let acc = document.getElementsByClassName("accordion");
        let i;
        for (i = 0; i < acc.length; i++) {
          acc[i].addEventListener("click", function () {
            this.classList.toggle("active");
            let panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
              panel.style.maxHeight = null;
            } else {
              panel.style.maxHeight = panel.scrollHeight + "px";
            }
          });
        };
      });
    });
  }

  public async render(): Promise<void> {
    this.domElement.innerHTML = `
    <section class="${styles.areaLmsWebpart} ${!!this.context.sdks.microsoftTeams ? styles.teams : ''}">
      <div class="${styles.welcome}">
      <!--<div class="${styles.welcome}"> <strong>${escape(this.properties.title)}</strong></div>
          <div>${escape(this.properties.description)}</div>-->
          <div></div>
          <div class="${styles.areaLmsWebpart}">
            <div id="spListContainer">
            </div>
          </div>
      </div>
    </section>`;
    this._renderList();
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      // this._environmentMessage = message;
    });
  }
  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              throw new Error('Unknown host');
          }
          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    // this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('title', {
                  label: "Title"
                }),
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}