import React from "react";
import { useState, useEffect } from "react";
import { Table, Popconfirm, Button, Space, Form, Input} from "antd";
import { isEmpty } from "lodash";
import axios from "axios";
import { SearchOutlined } from "@ant-design/icons";
import  {Highlighter}  from "react-highlight-words";

export const DataTable = () => {
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editRowKey, setEditRowKey] = useState("");
  const [sortedInfo, setSortedInfo] = useState({});
  const [searchColText , setSearchColText] = useState("");
  const [ searchedCol, setSearchCol] = useState("")
  const [form]= Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const reset = () =>{
    setSortedInfo({})
    loadData();
  }

  const getColumnSearchProps = (dataIndex) =>({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) =>(
      <div style={{padding:0}}>
         <Input
         placeholder={`search ${dataIndex}`}
         value={selectedKeys[0]}
         onChange={(e)=>setSelectedKeys(e.target.value ? [e.target.value] : [])}
         onPressEnter={()=>handleSearchCol(selectedKeys , confirm , dataIndex)}
         style={{width: 188 , marginBottom: 0 , display:"block"}}
         />
         <Space>
          <Button type="primary" 
          onClick={()=>handleSearchCol(selectedKeys , confirm , dataIndex)}
          icon={<SearchOutlined />}
          size="small"
          style={{width:90}}>
           Search
          </Button>
          <Button type="primary" 
          onClick={()=>handleResetCol(clearFilters)}
          size="small"
          style={{width:90}}>
           Reset
          </Button>
         </Space>
      </div>
    ),
    filterIcon: filtered=>
      <SearchOutlined style={{color: filtered ? "#1890ff" : undefined}}/>
    ,
    onFilter: (value , record) =>
    record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()):"",
    render: (text) =>
    searchedCol === dataIndex ? (
      <Highlighter
    highlightStyle={ {backgroundColor : "#ffc069" , padding : 0}}
    searchWords={[searchColText]}
    autoEscape
    textToHighlight={text ? text.toString(): ""}
    />
    ) :(text)
  })

  const loadData = async () => {
    setLoading(true);
    const response = await axios.get(
      "https://jsonplaceholder.typicode.com/comments"
    );
    setGridData(response.data);
    setLoading(false);
  };

  const datawithDate = gridData.map((item) => ({
    ...item,
    date: Date(Math.floor(Math.random() * Date.now())),
    status: "Open",
  }));

  const modifiedData = datawithDate.map(({ body, name, ...item }) => ({
    ...item,
    key: item.id,
    description: isEmpty(body) ? item.description : body,
    title: isEmpty(name) ? item.description : name,
  }));

  const handleDelete = (value) => {
    const dataSource = [...modifiedData];
    const filteredData = dataSource.filter((item) => item.id !== value.id);
    setGridData(filteredData);
  };
  const isEditing = (record) =>{
      return record.key === editRowKey
  }
  const cancel =() =>{
      setEditRowKey("")
  }
  const save = async(key) =>{
    try {
        const row = await form.validateFields();
        const newData = [...modifiedData];
        const index = newData.findIndex((item)=> key === item.key);
        if (index>-1){
            const item = newData[index];
            newData.splice(index , 1 , {...item , ...row});
            setGridData(newData);
            setEditRowKey("")
        }
    }
    catch(error){
        console.log("error" , error)
    }
    
  }
  const edit =(record) =>{
    form.setFieldValue({
        title:"",
        description:"",
        date:"",
        ...record,
    })
    setEditRowKey(record.key)
  }
  const handleChange = (...sorter) =>{
   console.log("sorter" , sorter)
   const {order , field} = sorter[2];
   setSortedInfo({columnkey: field , order})
  }

  const handleSearchCol = (selectedKeys , confirm , dataIndex)=>{
    confirm();
    setSearchColText(selectedKeys[0]);
    setSearchCol(dataIndex)
  }
  const handleResetCol = (clearFilters) =>{
    clearFilters();
    setSearchColText("")
  }

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "Title",
      dataIndex: "title",
      align: "center",
      editTable: true,
      sorter : (a,b)=> a.title.length - b.title.length,
      sortOrder : sortedInfo.columnkey === "title" && sortedInfo.order,
      ...getColumnSearchProps("title"),
    },
    {
      title: "Description",
      dataIndex: "description",
      align: "center",
      editTable: true,
      sorter : (a,b)=> a.description.length - b.description.length,
      sortOrder : sortedInfo.columnkey === "description" && sortedInfo.order,
      ...getColumnSearchProps("description")
    },
    {
      title: "Date",
      dataIndex: "date",
      align: "center",
      editTable: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      align: "center",
      editTable: true,
    },
    {
      title: "Action",
      dataIndex: "action",
      align: "center",
      render: (_, record) =>{
        const editable = isEditing(record)
        return modifiedData.length >= 1 ? (
          <Space>
            <Popconfirm
              title="are you sure you want to delete"
              onConfirm={() => handleDelete(record)}
            >
              <Button danger type="primary" disabled={editable}>
                Delete
              </Button>
            </Popconfirm>
            {editable ? (
                <span>
                    <Space size="middle">
                        <Button onClick={()=>save(record.key)} type="primary" style={{marginRight :8}}>save</Button>
                        <Popconfirm title="are you sure you want to cancel before saving" onConfirm={cancel}>
                        <Button>cancel</Button>
                        </Popconfirm>
                    </Space>
                </span>
            ):(
                 <Button type="primary" onClick={()=> edit(record)}>Edit</Button>
            )}
           
          </Space>
        ) : null;
      },
    },
  ]; 

  const mergeColumns = columns.map((col)=>{
    if(!col.editTable){
        return col
    }
    return {
        ...col,
        onCell : (record)=>({
            record,
            dataIndex: col.dataIndex,
            title: col.title,
            editing : isEditing(record)
        })
    }
  })

  const EditableCell = ({editing , dataIndex , title , record , children , ...restProps})=>{
  return (
    <td {...restProps}>
         {editing? (
            <Form.Item name={dataIndex} style={{margin : 0}} rules={[{
                required: true,
            message : `please enter some value in ${title} field`
            }]}>
              <Input value={record}/>
            </Form.Item>
         ):(children)}
    </td>
  )
  }
  return (
    <div>
      <Space style={{marginBottom:16}}>
        <Button onClick={reset}>
          Reset
        </Button>
      </Space>
        <Form form={form} component={false}>
        <Table
        columns={mergeColumns}
        components={{
            body:{
                cell: EditableCell,
            },
        }}
        dataSource={modifiedData}
        bordered
        pagination={{ position: ["bottomCenter"] }} 
        loading={loading}
        onChange={handleChange}
      />
        </Form>
     
    </div>
  );
};
