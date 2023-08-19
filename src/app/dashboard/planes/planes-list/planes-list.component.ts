import { Component, OnInit } from '@angular/core'
import { Observable } from 'rxjs';
import { Planes } from '../../../interfaces/planes';
import { Empresa } from '../../../interfaces/empresas';

import { PlanesService } from '../../../servicios/planes.service';
import { EmpresasService } from '../../../servicios/empresas.service';

import {ServcioRetornoPrecioService} from '../../../servicios/servcio-retorno-precio.service';
import {ServicioDeCompararService} from '../../../servicios/servicio-de-comparar.service';
import { ModalService } from '../../../_modal';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';


declare var actualizarPrecios:any;

@Component({
  selector: 'app-planes-list',
  templateUrl: './planes-list.component.html',
  styleUrls: [ './planes-list.component.css']  
})
export class PlanesListComponent implements OnInit {
  planes$: Observable<Planes[]> = new Observable();
  arrayActualizado: any;
  planDialog: boolean = false;
  public search: string = '';

  addPlanDialog: boolean = false;

  deletePlanDialog: boolean = false;

  deletePlanesDialog: boolean = false;

  planes: Planes[] = [];

  empresas: Empresa[] = [];

  plan: Planes = {};
  
  lempresa = [{}];
   
  selectedPlanes: Planes[] = [];
  submitted: boolean = false;
  columns: any[] = [];
  rowsPerPageOptions = [5, 10, 20];
  constructor(
    private planesService: PlanesService,
    private retornarService: ServcioRetornoPrecioService,
    private servicioComparar: ServicioDeCompararService,
    private modalService : ModalService,
    private http: HttpClient,
    private messageService: MessageService,
    private empresasService: EmpresasService
    ) { }
    ngOnInit(): void {
  
      this.fetchEmpresas()
      this.columns = [
        { field: 'name', header: 'Plan' },
        { field: 'name', header: 'Nombre' },
        { field: '_id', header: 'id' },
   
        { field: 'rating', header: 'Reviews' },
    ];  
      this.retornarService.disparadorDePrecio.subscribe(data=>{
        console.log('Recibiendo data en planes-list...',data);
        this.fetchPlanes();

  this.planes$.subscribe(planes => {
    console.log('array1:', planes);
    console.log('datas:', data);
    const resultado = this.planesService.actualizarPrecios(planes, data);
    console.log('resultado:', resultado);
    this.arrayActualizado = resultado;
});

        
  });
    }

    onGlobalFilter(table: Table, event: Event) {
      table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openModa(id: string) {
      this.modalService.open('custom-modal-3');
  
    }
  
    closeModa(id: string) {
      this.modalService.close('custom-modal-3');
  
    }


  deletePlan(id: string): void {
    this.planesService.deletePlan(id).subscribe({
      next: () => this.fetchPlanes()
    });
  }

  
  private fetchEmpresas(): void {
    this.empresasService.getEmpresas().subscribe({
      next: (empresas: Empresa[]) => {
        this.empresas = empresas;
        console.log(this.empresas)
        this.fetchPlanes();      },
      error: (error: any) => {
        console.error('Error al obtener las empresas:', error);
      }
    });
  }
  
  private fetchPlanes(): void {
    this.planesService.getPlanes().subscribe({
      next: (planes: Planes[]) => {
        this.planes = planes;
        this.mergeImagesToPlanes()
        console.log(this.planes)

      },
      error: (error: any) => {
        console.error('Error al obtener las empresas:', error);
      }
    });
  }

  private mergeImagesToPlanes(): void {
    this.planes.forEach(plan => {
      const matchingEmpresa = this.empresas.find(empresa => empresa.sigla === plan.sigla);
    
      if (matchingEmpresa && matchingEmpresa.images && matchingEmpresa.images.length > 0) {
        if (!plan.imagenes) {
          plan.imagenes = [];
        }
        const firstEmpresaImage = matchingEmpresa.images[0]; // Cambia 'url' por el nombre correcto de la propiedad en 'images'
        if (typeof firstEmpresaImage === 'string') {
          plan.imagenes[0] = firstEmpresaImage;
        }
      }
    });
  }
  
  
  

  openNewPlan() {
    this.submitted = false;
    this.addPlanDialog = true;
  }
  
  
deleteSelectedPlanes() {
  this.deletePlanesDialog = true;
}

editPlan(plan: Planes) {
  this.plan = { ...plan };
  this.planDialog = true;
}

hideDialogPlan() {
  this.planDialog = false;
  this.addPlanDialog = false;
  this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Formulario cancelado.', life: 3000 });
  this.submitted = false;
}

planEditadoHandler(plan: Planes) {
  const index = this.planes.findIndex(c => c._id === plan._id);

  if (index === -1) {
    console.error('El plan no existe en el array de planes.');
    return;
  }
}

confirmDeleteSelectedPlan() {
  this.deletePlanesDialog = false;
  const idsToDelete: string[] = [];
this.selectedPlanes.forEach(plan => {
  if (plan._id) {
    idsToDelete.push(plan._id);
  }
});
  idsToDelete.forEach(id => {
      this.planesService.deletePlan(id).subscribe({
        next: () => this.fetchPlanes(),
        error: (error: any) => {
          console.error(`Falló eliminar plan: ID ${id}`, error);
        }
      });
    });
  this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Plan Borrada', life: 3000 });
  this.selectedPlanes = [];
}
hideModalPlan() {
this.planDialog = false;
this.addPlanDialog = false;
this.submitted = false;
}

confirmDeletePlan(id: string): void {
  // Obtener el nombre de la clínica antes de eliminarla
  const plan = this.planes.find(c => c._id === id);
  const planNombre = plan ? plan.name : 'Plan'; // Si no se encuentra la clínica, se asigna un valor por defecto
  
  this.deletePlanDialog = false;
  this.planesService.deletePlan(id).subscribe({
    next: () => {
      this.fetchPlanes(); // Actualizar la lista de clínicas después de la eliminación
  
      // Mostrar mensaje con el nombre de la clínica eliminada
      this.messageService.add({
        severity: 'success',
        summary: 'Successful',
        detail: `${planNombre} eliminada `,
        life: 3000
      });
    },
    error: (error) => {
      console.error(error);
    }
  });
  }
  
  planAgregadoHandler(plan: Planes) {
    // Realiza la acción que necesites con la clínica agregada
    this.planes.push(plan);
    this.addPlanDialog = false;
    
    const planAgregado = this.planes.find(c => c._id === plan._id);
    
    if (planAgregado) {
      const planNombre = planAgregado.name;
    
      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `¡${planNombre} se agrogó exitosamente!`, life: 3000 });
    }
    }
}
