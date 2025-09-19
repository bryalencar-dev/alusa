"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Users, Clock } from "@/components/icons/icons";

export default function MatriculasPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Matrículas</h1>
          <p className="text-sm text-gray-600 mt-1">Gestão de matrículas e turmas</p>
        </div>
        <Button disabled className="bg-violet-600 hover:bg-violet-700 text-white">
          Nova Matrícula
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Matrículas Ativas</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Turmas Abertas</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-violet-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Módulo de Matrículas
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Esta funcionalidade está em desenvolvimento. Em breve você poderá gerenciar 
            matrículas, turmas e relacionamentos aluno-professor.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" disabled>
              Ver Planos
            </Button>
            <Button disabled>
              Solicitar Acesso
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}