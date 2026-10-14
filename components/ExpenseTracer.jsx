import React, { useState } from 'react'

const ExpenseTracer = ({tripid,members=[],createdby,expenses,onexpenseadd}) => {
    const [showmodel,setshowmodel]=useState(false);
    const totalexpenses=expenses.reduce((acc,current)=>acc+(Number(current.amount)||0),0);
    const getmemebername=(id)=>{
        const found=members.find(m=>(m._id.toString())===id.toString());
        return found?.name|| found?.email||"member";
    }
    const [form,setform]=useState({
        title:"",
        amount:"",
        category:"other",
        paidby:"",
        splitamong:[],
        doessplit:false,
    })
    const handleopenmodel=()=>{
        setshowmodel(true);
    }
    const submitexpensedetails=async (e)=>{
        e.preventDefault();

        const res=await fetch(`/api/trips/${tripid}/expense`,
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                },
                body:JSON.stringify({
                    expensedata:form,
                })
            }
        )
        if(res.status===200){
            alert("expense detail is saved");
            onexpenseadd();
            setshowmodel(false);
        }
    }
    const calculatesettelments=()=>{
        const balances={};
        members.forEach((m)=>{
            const id=m._id.toString();
            balances[id]=0;
        });

        expenses.forEach((exp)=>{
            const amount=Number(exp.amount)||0;
            const payerid = exp.paidby?._id?.toString() || exp.paidby?.toString();
            const splitlist=exp.splitamong;

            if(splitlist.length===0 || amount ===0){
                return;
            }
            const perpesonshare=amount/splitlist.length;

            if(balances[payerid] !==undefined){
                balances[payerid]+=amount;
            }
            splitlist.forEach((consumer)=>{
                const consumerid = consumer?._id?.toString() || consumer?.toString();
                if(balances[consumerid]!==undefined){
                    balances[consumerid]-=perpesonshare
                }
            })
           
        })
        const debtors=[];
        const creditors=[];

            Object.keys(balances).forEach((id)=>{
                const bal=Math.round(balances[id]);
                if(bal<0){
                    debtors.push({id,amount:Math.abs(bal)});
                }
                else if(bal>0){
                    creditors.push({id,amount:Math.abs(bal)}); 
                }

        })

        const settlements=[];
        let i=0;
        let j=0;
        while(i<debtors.length && j<creditors.length){
            const debtor=debtors[i];
            const creditor=creditors[j];

            const settleamount=Math.min(debtor.amount,creditor.amount);

            settlements.push({
                from:getmemebername(debtor.id),
                to:getmemebername(creditor.id),
                amount:settleamount,
            })
            debtor.amount -= settleamount;
            creditor.amount -= settleamount;
            if (debtor.amount === 0) i++;
            if (creditor.amount === 0) j++;
            }
            return settlements;
        }

        const settlements = calculatesettelments();
    
  return (
    <div>
      <div>
        <span>total trip expense</span>
        <h2>{totalexpenses}</h2>
        {
            expenses.map((expense,idx)=>{
                return(
                <div key={idx}>
                    <div>{expense.title}</div>
                    <div>{expense.amount}</div>
                    <div>{expense.category}</div>
                    <div>{getmemebername(expense.paidby)}</div>
                    <div>splitted between::{expense.splitamong.map(s=>(getmemebername(s)))}  </div>
                
                </div>)
            })
        }
        <h1>summary of the all expenses:</h1>
        {
            settlements.length===0?(
                <p>no one owes no one</p>
            ):(
                <div>
                    {
                        settlements.map((s)=>{
                            return(
                                <div>
                                    <span>{s.from} owes  {s.to}</span>
                                    <span> ₹{s.amount.toLocaleString()}</span>
                                </div>
                            )
                        })
                    }
                </div>
            )
        }
        
        <button onClick={handleopenmodel}>+add expense</button>
      </div>
      {showmodel && (
        <div>
            <div>
                <h3>add new expense</h3>
                <form onChange={(e) => setform((curr) => ({ ...curr, [e.target.name]: e.target.value }))}>
                    <div>
                        <label htmlFor="title">title</label>
                        <input type="text" placeholder='e.g.dinner,cab' name='title'/>

                    </div>
                    <div>
                        <label htmlFor="amount">amount</label>
                        <input type="number" placeholder='$' name='amount' />
                    </div>
                    <div>
                        <select name="category" id="" value={form.category}  onChange={(e) => setform(curr => ({ ...curr, category: e.target.value }))}>
                            <option value="food">food</option>
                            <option value="transport">transport</option>
                            <option value="activity">activity</option>
                            <option value="hotel">hotel</option>
                            <option value="other">other</option>
                        </select>
                    </div>
                    <div>
                        <label>
                            <input type="checkbox" name='doessplit' checked={form.doessplit} onChange={(e)=>setform(curr=>({...curr, doessplit : e.target.checked}))} />
                            split equeally among all members?
                        </label>
                    </div>
                    <div>
                        <label htmlFor="paidby">who paid?</label>
                        <select name="paidby" value={form.paidby} required onChange={(e) => setform(curr => ({ ...curr, paidby: e.target.value }))}>
                            <option value="">select who paid</option>

                            {createdby && (
                                <option value={createdby._id||createdby}>
                                    {createdby.name||createdby.email||"trip creator(you)"}
                                </option>


                            )}
                            {
                                members.map((m,idx)=>{
                                    <option value={m._id||m } key={idx}>
                                        {m.name||m.email||`member ${idx+1}`}
                                    </option>
                                })
                            }
                        </select>
                    </div>
                    <div>
                        <button type='button' onClick={()=>{setshowmodel(false)}}>cancel</button>
                        <button onClick={submitexpensedetails}>save</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}

export default ExpenseTracer
