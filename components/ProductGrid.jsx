"use client";
import React from "react";
import ProductGridEditable from "./ProductGridEditable";
import ProductGridReadOnly from "./ProductGridReadOnly";

export default function ProductGrid({ products = [], category, readOnly = false, onItemsChange }) {
  return readOnly ? (
    <ProductGridReadOnly products={products} onItemsChange={onItemsChange} category={category} />
  ) : (
    <ProductGridEditable products={products} onItemsChange={onItemsChange} category={category}  />
  );
}