import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductsDto, ProductsQueryDto } from './dto/search-products.dto';
import { ParseDatabaseIdPipe } from '../common/parse-database-id.pipe';
import { JwtOrSupabaseAuthGuard } from '../auth/jwt-or-supabase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos activos con paginación y filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'price', 'createdAt', 'id'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Lista paginada de productos' })
  findAll(@Query() query: ProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('admin')
  @UseGuards(JwtOrSupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los productos (incluye inactivos) - Solo Admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'price', 'createdAt', 'id'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Lista completa paginada de productos' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  findAllAdmin(@Query() query: ProductsQueryDto) {
    return this.productsService.findAllAdmin(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar productos por término con paginación' })
  @ApiQuery({ name: 'q', required: true, description: 'Término de búsqueda' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'price', 'createdAt', 'id'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Productos encontrados' })
  search(@Query() query: SearchProductsDto) {
    return this.productsService.search(query);
  }

  @Get('categories')
  categories() {
    return this.productsService.categories();
  }

  @Get('category/:categoryName')
  @ApiOperation({ summary: 'Obtener productos por categoría con paginación y filtros' })
  @ApiParam({ name: 'categoryName', description: 'Nombre de la categoría' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'price', 'createdAt', 'id'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Productos de la categoría' })
  findByCategory(
    @Param('categoryName') categoryName: string,
    @Query() query: ProductsQueryDto
  ) {
    return this.productsService.findByCategory(categoryName, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id', ParseDatabaseIdPipe) id: number) {
    return this.productsService.findOne(+id);
  }

  @Post()
  @UseGuards(JwtOrSupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo producto - Solo Admin' })
  @ApiResponse({ status: 201, description: 'Producto creado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtOrSupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar producto - Solo Admin' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  update(@Param('id', ParseDatabaseIdPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(+id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtOrSupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar producto - Solo Admin' })
  @ApiParam({ name: 'id', description: 'ID del producto' })
  @ApiResponse({ status: 200, description: 'Producto eliminado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  delete(@Param('id', ParseDatabaseIdPipe) id: number) {
    return this.productsService.delete(+id);
  }
}
