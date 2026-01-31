"use client"

import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

const projects = [
  {
    title: 'E‑Commerce Anomaly Detection',
    desc: 'XGBoost model + D3 visualizations to detect order anomalies and reduce fraud by 23%.',
    tags: ['XGBoost', 'D3', 'ETL'],
  },
  {
    title: 'Demand Forecasting',
    desc: 'Time series pipeline with Prophet and a dashboard for stakeholder reports.',
    tags: ['Prophet', 'Time Series', 'Airflow'],
  },
  {
    title: 'Customer Segmentation',
    desc: 'K‑means + UMAP for segmentation and targeted marketing experiments.',
    tags: ['Clustering', 'UMAP', 'A/B'],
  },
]

export default function Projects() {
  return (
    <section className="p-8 py-20">
      <h3 className="text-xs font-black uppercase tracking-widest mb-6">Selected Projects</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{p.title}</CardTitle>
                <CardDescription>{p.tags.join(' • ')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{p.desc}</p>
              </CardContent>
              <CardFooter className="justify-between">
                <div className="text-xs text-slate-500">Case Study Available</div>
                <Button variant="ghost" size="sm">Open</Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
