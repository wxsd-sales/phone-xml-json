import express from "express";
import cors from "cors";
import path from "path";
import 'dotenv/config';
import fetch from "node-fetch";

const app = express();
const port = process.env.PORT || 5000;

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(path.join(__dirname, 'src'));
app.use(cors());
app.use(express.static(path.join(__dirname, 'src')));
app.use(express.json());

var router = express.Router();
// simple logger for this router's requests
// all requests to this router will first hit this middleware
router.use(function(req, res, next) {
  if(req.url !== "/status"){
    console.log('%s %s', req.method, req.url);
  }
  next();
});

let returnUrl = process.env.BASE_URL + '/xml';//?device=#DEVICENAME#

function returnXML(pagePrompt, defaultBadge){
  if(!pagePrompt){
    pagePrompt = "Enter Badge Number";
  }
  if(!defaultBadge){
    defaultBadge = "";
  }
  return `
    <CiscoIPPhoneInput>
        <Title>${process.env.APP_TITLE}</Title>
        <Prompt>${pagePrompt}</Prompt>
        <URL method="post">${returnUrl}</URL>
        <InputItem>
            <DisplayName>Badge</DisplayName>
            <QueryStringParam>badge</QueryStringParam>
            <DefaultValue>${defaultBadge}</DefaultValue>
            <InputFlags>N</InputFlags>
        </InputItem>
    </CiscoIPPhoneInput>
  `;
}

function returnText(responseText){
  return `
      <CiscoIPPhoneText>
        <Title>${process.env.APP_TITLE}</Title>
        <Prompt></Prompt>
        <Text>${responseText}</Text>
        <SoftKeyItem>
          <Name>Exit</Name>
          <URL>Init:Services</URL>
          <Position>4</Position>
        </SoftKeyItem>
      </CiscoIPPhoneText>
  `
}

async function makePost(badge){
  //TODO: replace the POST with this, once the partner gets back to us with more info:

  // API Requirements  (POST /api/v1/timekeeping/punches/import)
  // {
  //     "punches": [
  //         {
  //             "punchDtm": "{{PunchDTM}}",
  //             "employee": {
  //                 "qualifier": "{{Personnum}}"
  //             },
  //             "typeOverride": {
  //                 "id": {{OverrideType}}
  //             }
  //         }
  //     ]
  // }
  let newDate = new Date().toISOString();
  let message = `Badge:${badge}\nTime:${newDate}`;
  console.log('makePost message:', message);
  let payload = {number:process.env.PHONE_NUMBER, message:message};
  let resp = await fetch(process.env.POST_URL,{
    method: "POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
  let json = await resp.text();
  console.log('POST response json:', json);
}

router.get('/', (req, res) => {
  res.setHeader('Content-Type',"application/xml");
  res.send(returnXML());
});

router.get('/xml', async (req, res) => {
  let xmlResponse;
  if(req.query.badge){
    await makePost(req.query.badge);
    xmlResponse = returnText("Success");
  } else {
     xmlResponse = returnXML("ERROR: Badge number required.", req.query.badge);
  }
  res.setHeader('Content-Type',"application/xml");
  res.send(xmlResponse);
});


app.use(`/`, router);
app.listen(port, async () => {
  console.log(`listening on ${port}`);
});
