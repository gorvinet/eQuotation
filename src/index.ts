import {html, css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';


@customElement('quotation-body')
export class QuotationBody extends LitElement {
  
  private QuotationID:String;
  private Customer:String;
  private token:String;


  @property()
  QuotationBody:Quotation=this.getEmptyQuotationBody();  

  @property()
  Error:Error={"error":{
                  "code":0,
                  "message":"Bad URL"}
              };  


  constructor() {
    super(); 
    this.QuotationID = this.GetURLParameter("ID");
    this.Customer = this.GetURLParameter("Customer");	
    this.token = "<<YOUR TOKEN>>";
    this.SetQuotationBody();  
  }  

  createRenderRoot() {   
    return this;
  }
  render() {
    if (this.QuotationBody.Quotation.ID) {
      return html ` 
      <legend>${this.QuotationBody.Quotation.Address}</legend>    
          ${this.templateOrderInfo()}                           
          ${this.templateQuestions()} `  
    } else {
        return this.templateError();
      }
    ;
  }

  //Templates

  templateOrderInfo(){
    return html`
    <div class="accordion" id="accordionOrderInfo">
      ${repeat(this.QuotationBody.OrderInfo, (OrderInfoItem) => OrderInfoItem.ID, (OrderInfoItem, index) => 
        html`
        <div class="accordion-item">
          <h2 class="accordion-header" id="block${index}">
            <button class="accordion-button ${(index>0) ? 'collapsed':''}" type="button" data-bs-toggle="collapse" data-bs-target="#blockcollapse${index}" aria-expanded=${(index>0) ? 'false':'true'}" aria-controls="blockcollapse${index}">
              ${OrderInfoItem.Title}	
            </button>
          </h2>
        <div id="blockcollapse${index}" class="accordion-collapse collapse ${(index==0) ? 'show':''}" aria-labelledby="block${index}" data-bs-parent="#accordionOrderInfo">
          <div class="accordion-body">
            ${(OrderInfoItem.Type=="Header")
            ? this.templateOrderInfoList(OrderInfoItem.Data,index) 
            : this.templateOrderInfoTable(OrderInfoItem.Data,index)
            } 
         </div>
        </div>               
      `)}        
    </div>`; 
  }

  templateOrderInfoList(OrderInfoData:OrderInfoData,i:number) {
    
    let block_id = "block" + i;
    
    return html `
    ${repeat(OrderInfoData.Columns, (column)=> column.ID, (column,index)  => html`
      <div class="mb-3 row">
        <label for="${column.ID}_${block_id}" class="col-sm-2 col-form-label"><strong>${column.Title}</strong></label>
        <div class="col-sm-10">
          <input type="text" readonly class="form-control-plaintext" id="${column.ID}_${block_id}" value="${OrderInfoData.Rows[0][index]}">
        </div>
      </div>
    `)}`;
  }

  templateOrderInfoTable(OrderInfoData:OrderInfoData,i:number) {
    
    let block_id = "block" + i;
    
    return html `
      <table class="table">
        <thead>
          <tr>
          ${repeat(OrderInfoData.Columns, (column) => column.ID, (column, index) => html`
            <th scope="col">
              ${column.Title}
            </th>
          `)}
          </tr>
        </thead>
        <tbody>
        ${repeat(OrderInfoData.Rows, (row) => row, (row,indexrow) => html`
          <tr>
            ${repeat(OrderInfoData.Columns, (column) => column.ID, (column,indexcolumn) => html`
            <td>${OrderInfoData.Rows[indexrow][indexcolumn]}</td>  
          `)}   
          </tr>
        `)}
        </tbody>
      <table>`;	 
  } 
  
  templateQuestions() {
    return html `
    <form class="needs-validation" id = "QuestionsForm" novalidate >
      <fieldset ?disabled=${this.QuotationBody.Quotation.isSubmited}>
        <legend>${(this.QuotationBody.Quotation.isSubmited) ? `Beantwortet am: ${this.QuotationBody.Quotation.SubmitDate.toLocaleString()}` : `Fragen`}</legend>
        ${repeat(this.QuotationBody.Questions, (Question) => Question.ID, (Question,index) => html`
          <div class="row mb-3">
            <label for="${Question.ID}" class="col-sm-2 col-form-label"> ${Question.Title}</label>
            <div class="col-sm-10">              
              <input id="${Question.ID}" class="${this.GetInputFieldClass(Question)}" type="${this.GetInputFieldType(Question)}" ?required=${Question.isRequired} value="${Question.Answer}" ?checked=${Question.Answer} >
            </div>
          </div> 
        `)}            
        <button type="button" class="btn btn-primary col-sm-10 float-end" id="SubmitButton" @click="${this.SubmitAnswers}">Senden</button>   
      </fieldset>      
    </form>`;	  
  }

  templateError() {
    return html`
    <div class="alert alert-primary"  role="alert">
      ${this.Error.error.message}
    </div> 
    `
  }
  
  
  private SetQuotationBody(){
    let HTTPrequestHeader =  this.GetHTTPrequestHeader();    
    if (HTTPrequestHeader) {
      axios.get(this.GetHTTPRequestURL(),HTTPrequestHeader)
      .then((response) => {
        this.QuotationBody =  response.data;       
      },(error) => {
        if( error.response ){
          this.Error = error.response.data;
        }        
      });      
    }
    else {
      this.QuotationBody = this.getEmptyQuotationBody()
    }
  }

  private SubmitAnswers(e: Event) {

    let QuestionForm = <HTMLFormElement>document.getElementById("QuestionsForm");
    
    QuestionForm.classList.add('was-validated'); 
      
    if (QuestionForm.checkValidity() && this.QuotationID) {
      
      let objResponse = <Response>{
         "QuotationID": this.QuotationID,
         "Answers":[]
      };		
  
      let questions = document.getElementsByClassName("question");
  
      for (var i = 0; i < questions.length; i++) {
        let curElement = questions[i];
        let currentInputElement = (<HTMLInputElement>document.getElementById(questions[i].id));
        const objAnswer = <Answer>{
            "id":currentInputElement.id,
            "value":undefined
          };
        if (currentInputElement.type == "checkbox") {
          objAnswer.value = currentInputElement.checked;
        } else {
          objAnswer.value = currentInputElement.value;
        }	
        
        objResponse.Answers.push(objAnswer);
      }
  
      let HTTPrequestHeader = this.GetHTTPrequestHeader();
      if (HTTPrequestHeader) {
        axios.put(this.GetHTTPRequestURL(),objResponse,HTTPrequestHeader)
        .then((response) => {
          this.SetQuotationBody();
        },(error) => {
          console.log(error);
          window.alert("Senden fehlgeschlagen"); 
        });         
        
      }
    }		
  }      

  private GetInputFieldClass(curQuestion:any) {
    switch(curQuestion.Type) {
      case "string":
        return `form-control question`;
      case "number":
        return  `form-control question`;
      case "date":
        return  `form-control question`;
      case "boolean":
        return  `form-check-input question`;
      default:
        return  `form-control question`; 
    }	
  }
  
  private GetInputFieldType(curQuestion:any) {
    switch(curQuestion.Type) {
      case "string":
        return `text`;
      case "number":
        return  `number`;
      case "date":
        return  `date`;
      case "boolean":
        return  `checkbox`;
      default:
        return  `text`; 
    }	
  }    

  private getEmptyQuotationBody():Quotation {
    return <Quotation>
    {
      "Quotation":{
        "ID":"",
        "Address":"",
        "isSubmited":false,
        "SubmitDate": new Date()},
      "OrderInfo":[{
        "ID":"",
        "Title":"",
        "Type":"",
        "Data":{
          "Columns": [{
            "ID":"",
            "Title":""}],
          "Rows":[[]]
          },
      }],
      "Questions":[{
        "ID":"",
        "Title":"",
        "isRequired":false,
        "Type":"",
        "Answer":""
        }]
    }     
  }

  private GetURLParameter(URLParameter: string) {
    var loc = window.location.href;				
    var index = loc.indexOf("?");				
    var splitted = loc.substr(index+1).split('&');	
        
    for(var i=0;i<splitted.length;i++){
      var params = splitted[i].split('=');
      var key = params[0];
      var value = params[1];
      if (key == URLParameter) {
        return value;
      }
    }
    return "";
  }

  private GetHTTPrequestHeader(){
      return {'headers':{'Authorization':`Basic ${this.token}`}};    
  }

  private GetHTTPRequestURL(){
    return  `https://dul-cloud.de/app/qp/${this.Customer}/hs/api/v1/Quotation/${this.QuotationID}`;
  }

  
}
  
//Interfaces

interface Response {
  QuotationID: string;
  Answers: Answer[];
}

interface Answer {
  id: string;
  value: any;
}

interface Quotation {
  "Quotation":{
    "ID":string,
    "Address":string,
    "isSubmited":boolean,
    "SubmitDate":Date},
  "OrderInfo":{
    "ID":string,
    "Title":string,
    "Type":string,
    "Data":OrderInfoData,
  }[],
  "Questions":{
    "ID":string,
    "Title":String,
    "isRequired":boolean,
    "Type":string,
    "Answer":any
    }[]
}

interface OrderInfoData{
  "Columns": {
    "ID":string,
    "Title":string}[],
  "Rows":[][]
  }
 
interface Error{
  "error":{
    "code":number,
    "message":string}
}  



