export function SkeletonLine({ w='100%', h=16 }: { w?:string; h?:number }) {
  return <div className="skeleton" style={{width:w,height:h,marginBottom:8}} />
}
export function SkeletonCard() {
  return (
    <div className="glass p-5">
      <SkeletonLine w="40%" h={12} /><SkeletonLine w="60%" h={28} /><SkeletonLine w="35%" h={12} />
    </div>
  )
}
