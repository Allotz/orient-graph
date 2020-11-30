import React, {Component} from 'react';
import './App.css';
import Axios from "axios";
import {Table, Label, Input, Form, FormGroup, Button} from "reactstrap";
import {Sigma, RandomizeNodePositions, RelativeSize} from 'react-sigma';
import ForceLink from 'react-sigma/lib/ForceLink'


class App extends Component{
    constructor(props){
        super(props);
        this.state = {
            lastResult: null,
            lastQuery: null,
            lastResultTableHeaders: [],
            graph: null,
            query: null,
            colours: {},
            board: 'graph'
        }
    }

    getRandomColor() {
        let letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }



    sigma_parser(queryData) {
        let nodes = new Array();
        let edges = new Array();
        console.log('edges before build', edges);
        queryData.forEach((item)=>{
            // Build des Edges depuis les données (Edges as Rows)
            if (Object.keys(item).find((e)=> {return e === 'in' || e === 'out'}) !== undefined){
                if(edges.find((e)=>{return e['@rid'] === item['@rid']})=== undefined){
                    item['id'] = item['@rid'];
                    item['source'] = item['in'];
                    item['target'] = item['out'];
                    edges.push(item);
                    // console.log('push edge', item['id'])
                }
            }else{
                // Build des Nodes depuis les données
                if(nodes.find((e)=>{return e['@rid'] === item['@rid']})=== undefined){
                    item['id'] = item['@rid'];
                    nodes.push(item);
                    // console.log('push edge', item['id'])
                }
            }
        });
        console.log(edges.length);
        console.log('nodes before proc', nodes);
        nodes.forEach((el)=>{
            el['id'] = el['@rid'];
            // console.log('class', el['@class']);
            // console.log('el_node', el);
            if(this.state.colours[el['@class']] === undefined){
                this.state.colours[el['@class']] = this.getRandomColor()
            }
            el['color'] = this.state.colours[el['@class']];
            // Object.keys(el).forEach((key) => {
            //     if(RegExp('in_').test(key)){
            //         let arr = key.split('_');
            //         el[key].forEach((edge) => {
            //             //edge = @rid
            //             // L'Arc existe-t-il? Si non, l'ajouter
            //             if (edges.find((e)=>{return e['id'] === edge}) === undefined){
            //                 console.log('push edges from node in');
            //                 edges.push({id: edge, });
            //             }
            //             edges.find((e)=>{return e['id'] === edge})['target'] = el['id'];
            //             edges.find((e)=>{return e['id'] === edge})['label'] = arr[arr.length -1];
            //         })
            //     }
            //     if(RegExp('out_').test(key)){
            //         let arr = key.split('_');
            //         el[key].forEach((edge) => {
            //             // console.log('edeg to add?', edge);
            //             // L'Arc existe-t-il? Si non, l'ajouter
            //             if (edges.find((e)=>{return e['id'] === edge}) === undefined){
            //                 console.log('push edges from node out');
            //                 edges.push({id: edge, });
            //             }
            //             edges.find((e)=>{return e['id'] === edge})['source'] = el['id'];
            //             edges.find((e)=>{return e['id'] === edge})['label'] = arr[arr.length -1];
            //         })
            //     }
            // })
        });

        //Nettoyage des Edges
        let final_edges = edges;
        console.log('edges Avant nettoyage', edges);
        edges.forEach((edge)=>{
            // On enlève les Edges sans nodes
            if(nodes.find((node)=>{return node['id']===edge['source']})===undefined || nodes.find((node)=>{return node['id']===edge['target']})===undefined){
                // console.log('A nettoyer', edge);
                console.log('Nettoyage');
                final_edges = final_edges.filter((v)=> {
                    return v['id'] !== edge['id']
                })
            }
            if(edge['@class']!==undefined ){
                if(this.state.colours[edge['@class']] === undefined){
                    this.state.colours[edge['@class']] = this.getRandomColor()
                }
                edge['color'] = this.state.colours[edge['@class']];
            }
        });
        console.log('edges après nettoyage', final_edges);

        this.setState({
            graph: {nodes: nodes, edges: final_edges}
        })
    }

    sendQuery(){
        let config = {
            auth: {
                username: 'reader',
                password: 'reader'
            },
            headers:{
                "Access-Control-Allow-Origin":	'*',


            }

        };
        this.setState({
            lastQuery: this.state.query
        });
        //https://orientstudio.flrnt.fr/connect/AI07_Social_Network
        Axios.get("https://orientstudio.flrnt.fr/connect/" + this.state.bdd, config)
            .then((r) => {
                if(this.state.lastQuery !== undefined){
                    //https://orientstudio.flrnt.fr/query/AI07_Social_Network/sql/
                    Axios.get("https://orientstudio.flrnt.fr/query/" + this.state.bdd + "/sql/" + this.state.lastQuery + "/-1", config)
                        .then((c) => {
                            this.setState({
                                lastResult: c.data
                            });
                            let tableHeadersTemp = [];
                            this.state.lastResult.result.forEach((el) => {
                                Object.keys(el).forEach((key)=>{
                                    if(tableHeadersTemp.find((header)=> {return header === key}) === undefined){
                                        tableHeadersTemp.push(key)
                                    }
                                })
                            });
                            this.setState({
                                lastResultTableHeaders: tableHeadersTemp
                            });
                            this.sigma_parser(this.state.lastResult.result);
                        })
                }

            })
            .catch((r)=>{
            })
    }



    table_head(){
        return(
            <thead>
                <tr>
                    {this.state.lastResultTableHeaders.map((header) => {
                        return (
                            <td>{header}</td>
                        )
                    })}
                </tr>
            </thead>
        )
    }

    table_body(){
        return(
            <tbody>
                {this.state.lastResult !== null &&
                this.state.lastResult.result.map((el) => {
                    return(
                        <tr>{
                            this.state.lastResultTableHeaders.map((header)=> {
                                return(
                                    <td>{el[header]}</td>
                                )
                            })
                        }</tr>
                    )
                })
                }
            </tbody>
        )
    }

    change_board(){
        this.setState({
            board: this.state.board === 'graph' ? 'data' : 'graph'
        })
    }


    render() {
        console.log(this.props.match.params.query);
        let myGraph = this.state.graph;
        if (this.state.lastResult !== null && this.state.graph === null){
            myGraph = this.state.graph;
        }
        else{
            // myGraph = {nodes:[], edges:[]};
        }
        return (
            <div className="App">
                <h1>OrientGraph</h1>
                <div>
                    {/*<Form //action={"/" + this.state.query} method="GET"*/}
                    {/*    id="FormQuery"*/}
                    {/*>*/}
                        <FormGroup>
                            <Label for="query">Requête</Label>
                            <Input type="text" name="query" id="query"
                                onChange={(e)=>{
                                    this.setState({
                                        query: e.target.value
                                    })
                                }}
                            />
                        </FormGroup>
                    {/*</Form>*/}
                    <Button key="submit" color="primary" onClick={() => {
                        console.log("Hello");
                        this.setState({
                            graph: null
                        });
                        this.sendQuery();
                    {/*    // post(auth_token, contrat.id, this.state.newStatus.id, this.state.commentaire, this.state.idRouteur, this.state.idAntenne, this.state.idPointFixe, this.state.ip);*/}
                    {/*    // getContratSingle(auth_token, contrat.id);*/}
                    }} value="Submit" >
                        Confirmer
                    </Button>
                    <Button onClick={()=>{
                        this.setState({
                            graph: null
                        })
                    }}>Clear</Button>
                </div>
                { this.state.board === 'data' &&
                    <>
                    <Button onClick={()=>{this.change_board()}}
                    >Graphe</Button>
                        <div className="table-responsive">
                            <Table hover responsive>
                                {this.table_head()}
                                {this.table_body()}
                            </Table>
                        </div>
                    </>
                }
                {/*<div id={"graph"}/>*/}
                { this.state.board === 'graph' &&
                    <>
                    <Button onClick={()=>{this.change_board()}}
                    >Data</Button>
                    <div style={{'text-align': 'left'}}>
                        {this.state.lastResult !== null && myGraph !== null &&
                        <Sigma graph={myGraph} settings={{drawEdges: true, clone: false, }}
                               style={{
                                   maxWidth:"inherit",
                                   maxHeight:"inherit",
                                   height: "90vh"
                               }}
                               onOverNode={e => console.log("Mouse over node: " + e.data.node.label)}
                        >
                            <ForceLink
                                randomize="locally"
                                barnesHutOptimize={false}
                                barnesHutTheta={0.5}
                                background
                                easing="cubicInOut"
                                gravity={1}
                                edgeWeightInfluence={0}
                                alignNodeSiblings={false}
                                timeout={2000}
                                outboundAttractionDistribution={false}
                            />
                            <RelativeSize initialSize={30}/>
                            <RandomizeNodePositions/>
                        </Sigma>
                        }
                    </div>
                    </>
                }
            </div>
        );
    }


    // Connection
    componentWillMount() {
        let config = {
            auth: {
                username: 'reader',
                password: 'reader'
            },
            headers:{
                "Access-Control-Allow-Origin":	'*',


            }

        };
        this.setState({
            bdd: this.props.match.params.bdd
        });
        //https://orientstudio.flrnt.fr/connect/AI07_Social_Network
        Axios.get("https://orientstudio.flrnt.fr/connect/" + this.state.bdd, config)
            .then((r) => {
                if(this.state.lastQuery !== undefined){
                    //https://orientstudio.flrnt.fr/query/AI07_Social_Network/sql/
                    Axios.get("https://orientstudio.flrnt.fr/query/" + this.state.bdd + "/sql/" + this.state.lastQuery + "/-1", config)
                        .then((c) => {
                            this.setState({
                                lastResult: c.data
                            });
                            this.sigma_parser(this.state.lastResult.result);
                        })
                }

            })
            .catch((r)=>{
            })

    }


}

export default App;
