import './list-pagination.css';
export default function ListPagination({page,onChange,count,loading,label}) {
  return <nav className="list-pagination" aria-label={`${label} pages`}><button type="button" disabled={loading||page===1} onClick={()=>onChange(page-1)}>Previous</button><span>Page {page}</span><button type="button" disabled={loading||count<50} onClick={()=>onChange(page+1)}>Next</button></nav>;
}
