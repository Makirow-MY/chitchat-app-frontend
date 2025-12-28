import React from 'react'

function CapitalizeName(name){
  if (!name.trim()) {
    return
  }
  else{
     return name.trim().split(/\s+/).map(word =>
      
     {return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()}).join(" ")
  }
}

export default CapitalizeName
