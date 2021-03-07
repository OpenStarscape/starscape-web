import React from 'react';
import { Lifetime, applyMixin } from '../core';

// eslint-disable-next-line
export interface LifetimeComponent<P, S> extends Lifetime {}
export class LifetimeComponent<P = {}, S = {}> extends React.Component<P, S> {
  constructor(props: P) {
    super(props);
    this.initLifetime();
  }

  componentWillUnmount() {
    this.dispose();
  }
}

applyMixin(LifetimeComponent, Lifetime);
