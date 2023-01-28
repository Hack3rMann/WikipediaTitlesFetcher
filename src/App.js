import { useState } from 'react';
import parse from 'html-react-parser';
function App() {
  const [search,setSearch] = useState("");
  const [results,setResults] = useState([]);
  const [searchInfo, setSearchInfo] = useState({});
  const handleSearch = async e => {
    e.preventDefault();
    if(search === '') return;
    const endpoint = `https://en.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&origin=*&srlimit=20&srsearch=${search}`;
    const response = await fetch(endpoint);
    if(!response.ok){
      throw Error(response.statusText);
    }
    const json = await response.json();
    setResults(json.query.search);
    setSearchInfo(json.query.searchinfo);
  }
  const evaluator = async e => {
    const endpoint = `https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&formatversion=2&page=${e}`;
    const response = await fetch(endpoint);
    if(!response.ok){
      throw Error(response.statusText);
    }
    const json = await response.json();
    let indepthparse = (f,obj) => {
      f.map((e)=>{
        if(e.data){
          obj.value += e.data;
        }
        else{
          let temp = {
            value: ''
          }
          indepthparse(e.children,temp);
          obj.value += temp.value;
        }
      });
    };
    const finalResult = [];
    parse(json.parse.text,{
      replace: domNode => {
        if(domNode.attribs){
            if(domNode.attribs.class && domNode.attribs.class === 'summary'){
              const children = domNode.children;
              let temp = '';
              children.map((e)=>{
                if(e.data){
                  temp += e.data;
                }
                else{
                  let obj = {
                    value:''
                  };
                  indepthparse(e.children,obj);
                  temp += obj.value;
                }
              });
              temp = temp.split("Transcription:")[0];
              temp = temp.replace(/[?*\\/"<>]/g,"").replace(/[:]/g,";");
              finalResult.push(temp);
            }
        }
      }
    })
    if(finalResult.length > 0){
      let result = '';
      finalResult.forEach(myFunction)
      function myFunction(item){
        result += item.replace("\"","");
        result += "\n";
      }
      const element = document.createElement("a");
      const file = new Blob([result],    
               {type: 'text/plain;charset=utf-8'});
      element.href = URL.createObjectURL(file);
      element.download = "EpisodeTitles.txt";
      document.body.appendChild(element);
      element.click();
    }
    else{
      console.log("No Titles Fetched"); //Need to work on this log more - to display the user there is no titles being fetched in UI.
    }
  }
  return (
    <div className="App">
      <header>
        <h1>Titles Fetcher</h1>
          <form className="search-box" onSubmit={handleSearch}>
                <input 
                  type="search"
                  placeholder="What are you Searching for?"
                  value={search}
                  onChange={e=>setSearch(e.target.value)}/>
          </form>
       {(searchInfo.totalhits)?<p>Search Result: {searchInfo.totalhits}</p>:
       ''}
      </header>
      <div className="results">
        {results.map((result,i)=>{
          const url = `https://en.wikipedia.org/?curid=${result.pageid}`
          return(
            <div className="result" key={i}>
              <h3>{result.title}</h3>
              <p dangerouslySetInnerHTML={{__html: result.snippet}}></p>
              <a href={url} target='_blank' rel='noreferrer'>Read More</a>
              <button onClick={e=>evaluator(result.title)}> Select </button>
          </div>
          )
        })}
            </div>    
    </div>
  );
}

export default App;
