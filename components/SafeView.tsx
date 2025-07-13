import React from 'react';
import { View, ViewProps } from 'react-native';

interface SafeViewProps extends ViewProps {
  children: React.ReactNode;
}

export const SafeView: React.FC<SafeViewProps> = ({ children, ...props }) => {
  // Função para limpar nós de texto soltos
  const cleanChildren = (children: React.ReactNode): React.ReactNode => {
    if (typeof children === 'string') {
      // Se for uma string vazia ou apenas espaços/pontos, retornar null
      if (children.trim() === '' || children.trim() === '.') {
        return null;
      }
      return children;
    }
    
    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (typeof child === 'string') {
          // Se for uma string vazia ou apenas espaços/pontos, retornar null
          if (child.trim() === '' || child.trim() === '.') {
            return null;
          }
        }
        return React.cloneElement(child as React.ReactElement, { key: index });
      }).filter(Boolean);
    }
    
    return children;
  };

  return (
    <View {...props}>
      {cleanChildren(children)}
    </View>
  );
}; 