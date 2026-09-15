import React from "react"
import logoImg from "../../assets/logo.png"

export function SJCETHeaderLogo({ height = 42 }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "2px 0",
        userSelect: "none",
      }}
    >
      <img
        src={logoImg}
        alt="SJCET Logo"
        style={{
          height: `${height}px`,
          maxHeight: "46px",
          width: "auto",
          objectFit: "contain",
          display: "block",
        }}
        onError={(e) => {
          e.target.src = "/logo.png"
        }}
      />
    </div>
  )
}
